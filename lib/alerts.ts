import { prisma } from './db';
import { sendScoreAlertEmail } from './email';

export interface AlertDecision {
  previousScore: number;
  currentScore: number;
  drop: number;
  newIssues: string[];
}

type ReportLike = { score?: { overall?: number }; criticalIssues?: string[] } | null | undefined;

/** Pure comparison, kept separate from I/O so the threshold logic is directly testable. */
export function computeAlert(previous: ReportLike, current: ReportLike, threshold: number): AlertDecision | null {
  const prevScore = previous?.score?.overall;
  const currScore = current?.score?.overall;
  if (typeof prevScore !== 'number' || typeof currScore !== 'number') return null;

  const drop = prevScore - currScore;
  if (drop < Math.max(1, threshold)) return null;

  const before = new Set(previous?.criticalIssues ?? []);
  const newIssues = (current?.criticalIssues ?? []).filter((i) => !before.has(i));
  return { previousScore: prevScore, currentScore: currScore, drop, newIssues };
}

/**
 * Called after a monitor-initiated scan completes. Compares it with the monitor's previous
 * completed scan and emails the account if the score regressed past the monitor's threshold.
 * Returns whether an alert was sent (false covers "no regression", "alerts off", "send failed").
 */
export async function evaluateMonitorAlert(scanId: string): Promise<boolean> {
  const scan = await prisma.scan.findUnique({ where: { id: scanId }, include: { monitor: true } });
  if (!scan?.monitor || scan.status !== 'COMPLETED') return false;
  // Simulated data means the site was unreachable; alerting on placeholder scores would be noise.
  if ((scan.crawlData as any)?.hasSimulatedData) return false;

  const previous = await prisma.scan.findFirst({
    where: {
      monitorId: scan.monitorId,
      status: 'COMPLETED',
      id: { not: scan.id },
      createdAt: { lt: scan.createdAt }
    },
    orderBy: { createdAt: 'desc' }
  });
  if (!previous || (previous.crawlData as any)?.hasSimulatedData) return false;

  const decision = computeAlert(previous.seoReport as any, scan.seoReport as any, scan.monitor.alertDrop);
  if (!decision) return false;

  const [settings, user] = await Promise.all([
    prisma.whiteLabelSettings.findUnique({ where: { userId: scan.userId } }),
    prisma.user.findUnique({ where: { id: scan.userId } })
  ]);
  if (!settings?.enableEmailAlerts) return false;
  const to = settings.monitoringEmail || user?.email;
  if (!to) return false;

  return sendScoreAlertEmail(to, {
    agencyName: settings.agencyName,
    url: scan.url,
    previousScore: decision.previousScore,
    currentScore: decision.currentScore,
    newIssues: decision.newIssues,
    reportUrl: process.env.APP_URL
  });
}
