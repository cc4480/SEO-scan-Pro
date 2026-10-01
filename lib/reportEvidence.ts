import { escapeHtml } from './email';

// The "Evidence" block of the downloadable report: how the scores were produced and what was
// measured about crawler access and JavaScript dependence. Everything interpolated is escaped.

export function evidenceSectionHtml(scan: any, accent: string): string {
  const report = scan.seoReport;
  const facts = scan.crawlData?.facts;
  if (!report) return '';

  const method =
    report.scoreMethod === 'measured'
      ? 'Scores are computed by fixed rules from the checks measured in this scan. They are not AI estimates, so the same site always scores the same.'
      : report.scoreMethod === 'illustrative'
        ? 'The site could not be reached; these scores are illustrative placeholders, not measurements.'
        : 'This report predates computed scores: its numbers were estimated by the AI model and can vary between runs.';

  const bots: any[] = facts?.botAccess?.results ?? [];
  const botRows = bots
    .map((r) => `<tr><td style="padding:3px 8px">${escapeHtml(r.name)}</td><td style="padding:3px 8px;color:#64748b">${escapeHtml(r.role)}</td><td style="padding:3px 8px;font-weight:700;color:${r.blocked ? '#be123c' : '#047857'}">${r.blocked ? 'Blocked' : 'OK'} (${escapeHtml(r.status || 'no response')})</td></tr>`)
    .join('');

  const rvr = facts?.rawVsRendered;
  const removed: any[] = report.qa?.removed ?? [];

  return `
    <div class="mb-8 p-6 rounded-2xl border border-slate-100 bg-white">
      <h2 class="text-lg font-bold mb-2" style="color: ${accent}">Evidence &amp; accuracy</h2>
      <p class="text-xs text-slate-500 mb-4">${escapeHtml(method)}</p>
      ${botRows ? `
      <h3 class="text-sm font-bold text-slate-700 mb-1">Crawler access (each crawler's own user agent)</h3>
      <table class="text-xs w-full mb-4" style="border-collapse:collapse"><tbody>${botRows}</tbody></table>` : ''}
      ${rvr ? `
      <h3 class="text-sm font-bold text-slate-700 mb-1">Without JavaScript vs after it runs</h3>
      <p class="text-xs text-slate-600 mb-1">Raw HTML: ${escapeHtml(rvr.rawWords)} words, ${escapeHtml(rvr.rawLinks)} links. Rendered: ${escapeHtml(rvr.renderedWords)} words, ${escapeHtml(rvr.renderedLinks)} links.</p>
      <p class="text-[11px] text-slate-400 mb-1">It is commonly reported that many AI retrieval crawlers do not run JavaScript; this scan did not test each crawler individually.</p>` : ''}
      ${removed.length ? `<p class="text-[11px] text-slate-400">${escapeHtml(removed.length)} AI suggestion(s) were removed because the measured evidence contradicted them.</p>` : ''}
    </div>`;
}
