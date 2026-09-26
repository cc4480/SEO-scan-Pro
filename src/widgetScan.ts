/**
 * Shared polling helper for the public lead-capture widget.
 *
 * Widget scans are queued asynchronously on the server: `POST /api/widget/scan` answers 202
 * immediately and the Puppeteer crawl plus the AI report then run in the background. The
 * widget UI shows the score, the executive summary and a report link, none of which exist
 * until the scan completes — so without polling it renders "undefined" and the report link
 * 404s. `GET /api/widget/scan/:id` is public but only answers for scans that carry a
 * leadEmail, so it can never expose an owner-run audit.
 */
export interface WidgetScanStatus {
  id: string;
  url: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  score: number | null;
  criticalIssuesCount: number;
  executiveSummary: string | null;
}

export async function waitForWidgetScan(
  scanId: string,
  onWaiting?: (message: string) => void,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<WidgetScanStatus | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const res = await fetch(`/api/widget/scan/${scanId}`);
      if (!res.ok) continue;

      const status = (await res.json()) as WidgetScanStatus;
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }

      onWaiting?.('Generating your AI SEO report...');
    } catch {
      // Transient failure — keep polling until the attempts run out.
    }
  }

  return null;
}
