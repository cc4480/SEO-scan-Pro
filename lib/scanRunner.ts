import { crawlUrl } from './crawler';
import { generateSeoReport } from './deepseek';
import { prisma } from './db';
import { sendWebhook } from './webhook';
import { enqueue, queueStats } from './queue';
import { openProgress, closeProgress } from './progress';
import { evaluateMonitorAlert } from './alerts';

export type Lead = { email: string; name?: string };

/** Hands a scan row to the queue. Never throws and never blocks the caller. */
export function queueScan(
  scanId: string,
  url: string,
  mode: 'SINGLE' | 'FULL_SITE',
  depth: number,
  userId: string,
  lead?: Lead
): void {
  const progress = openProgress(scanId, userId);
  const q = queueStats();
  if (q.running >= q.concurrency) {
    progress.emit('scan', 'info', `waiting for a free scan slot (${q.running} running, ${q.waiting} queued ahead)`);
  }
  enqueue(() => runScan(scanId, url, mode, depth, userId, lead));
}

// Runs from the queue, not awaited by any route, so the scan row can be deleted out from under
// it mid-flight (user deletes the scan, or their account, while this is still running). Both
// updates use updateMany, which is a no-op on zero matched rows instead of throwing P2025.
export async function runScan(
  scanId: string,
  url: string,
  mode: 'SINGLE' | 'FULL_SITE',
  depth: number,
  userId: string,
  lead?: Lead
): Promise<void> {
  const progress = openProgress(scanId, userId);
  const startedAt = Date.now();
  try {
    console.log(`Starting scan ${scanId} for URL: ${url}`);
    progress.emit('scan', 'start', `scan started (${mode === 'FULL_SITE' ? `deep crawl, depth ${depth}` : 'single page'})`);
    const crawlRes = await crawlUrl(url, mode, depth, progress.emit);
    const seoReport = await generateSeoReport(crawlRes, progress.emit);

    progress.emit(
      'scan',
      crawlRes.hasSimulatedData ? 'warn' : 'ok',
      `audit finished in ${((Date.now() - startedAt) / 1000).toFixed(1)}s${crawlRes.hasSimulatedData ? ' · some data is SIMULATED (the site could not be read), so this is not a real audit' : ''}`
    );
    // The complete log is saved with the scan: the audit trail outlives the live view.
    crawlRes.log = progress.events();

    await prisma.scan.updateMany({
      where: { id: scanId },
      data: { status: 'COMPLETED', crawlData: crawlRes as any, seoReport: seoReport as any }
    });

    console.log(`Scan ${scanId} completed successfully`);
  } catch (err: any) {
    console.error(`Scan ${scanId} failed:`, err);
    progress.emit('scan', 'fail', `scan aborted: ${String(err?.message ?? err).slice(0, 200)}`);
    // Keep the log on failed scans too: it is the explanation of what went wrong.
    await prisma.scan
      .updateMany({ where: { id: scanId, status: 'PENDING' }, data: { status: 'FAILED', crawlData: { log: progress.events() } as any } })
      .catch((e) => console.error(`Could not mark scan ${scanId} as FAILED:`, e));
    closeProgress(scanId);
    return;
  }
  closeProgress(scanId);

  // Everything below runs after the report is stored. A failure here (webhook, alert email) must
  // not flip a completed audit to FAILED, so it is contained on its own.
  try {
    const scan = await prisma.scan.findUnique({ where: { id: scanId } });
    const seoReport = scan?.seoReport as any;

    // Widget-originated (lead) scans notify the agency's configured webhook, if any.
    if (lead && seoReport) {
      const settings = await prisma.whiteLabelSettings.findUnique({ where: { userId } });
      if (settings?.webhookUrl) {
        await sendWebhook(settings.webhookUrl, settings.webhookSecret, {
          event: 'seo_lead_captured',
          timestamp: new Date().toISOString(),
          agencyName: settings.agencyName,
          scanId,
          targetUrl: url,
          leadEmail: lead.email,
          leadName: lead.name,
          overallScore: seoReport.score?.overall,
          criticalIssuesCount: seoReport.criticalIssues?.length ?? 0
        });
      }
    }

    if (scan?.monitorId) await evaluateMonitorAlert(scanId);
  } catch (err) {
    console.error(`Post-scan work for ${scanId} failed:`, err);
  }
}

/**
 * The queue is in memory, so a restart orphans every scan that was PENDING. Nothing will ever
 * finish them; mark them FAILED so the UI stops spinning and users can re-run.
 */
export async function recoverStuckScans(): Promise<number> {
  const res = await prisma.scan.updateMany({ where: { status: 'PENDING' }, data: { status: 'FAILED' } });
  if (res.count > 0) console.warn(`Marked ${res.count} scan(s) left PENDING by a previous run as FAILED.`);
  return res.count;
}
