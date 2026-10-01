import { escapeHtml } from './email';
import { botVerdict, classifyBots } from './audit/botVerdict';

// The "Evidence" block of the downloadable report: how the scores were produced and what was
// measured about crawler access and JavaScript dependence. Everything interpolated is escaped.

export function evidenceSectionHtml(scan: any, accent: string): string {
  const report = scan.seoReport;
  const crawl = scan.crawlData;
  const facts = crawl?.facts;
  if (!report) return '';

  const challenge = crawl?.pageKind === 'challenge';
  const method =
    report.scoreMethod === 'measured'
      ? 'Scores are computed by fixed rules from the checks measured in this scan. They are not AI estimates, so the same site always scores the same.'
      : report.scoreMethod === 'illustrative'
        ? challenge
          ? `The site served a bot challenge${crawl?.challengeReason ? ` (${crawl.challengeReason})` : ''}, so the real page could not be audited; these scores are illustrative placeholders, not measurements.`
          : 'The site could not be reached; these scores are illustrative placeholders, not measurements.'
        : 'This report predates computed scores: its numbers were estimated by the AI model and can vary between runs.';

  const bots: any[] = facts?.botAccess?.results ?? [];
  const botRows = bots
    .map((r) => {
      const v = botVerdict(r, facts.botAccess);
      const label = v === 'ok' ? 'OK' : v === 'inconclusive' ? 'Refused (cannot confirm)' : v === 'policy' ? 'Refused (as robots.txt asks)' : 'Blocked';
      const color = v === 'ok' ? '#047857' : v === 'genuine' ? '#be123c' : '#b45309';
      return `<tr><td style="padding:3px 8px">${escapeHtml(r.name)}</td><td style="padding:3px 8px;color:#64748b">${escapeHtml(r.role)}</td><td style="padding:3px 8px;font-weight:700;color:${color}">${label} (${escapeHtml(r.status || 'no response')})</td></tr>`;
    })
    .join('');
  const cls = facts?.botAccess ? classifyBots(facts.botAccess) : null;
  const botNote = cls && cls.inconclusive.length
    ? 'Some crawlers refused an imitation of their user agent (or the site refuses every non-browser client). That cannot be confirmed as a block and costs no score points; check Google Search Console, Bing Webmaster Tools or your server logs.'
    : '';

  const unreadable = [
    crawl?.robotsReadable === false && 'robots.txt',
    crawl?.sitemapChecked === false && 'the sitemap',
    crawl?.llmsChecked === false && 'llms.txt'
  ].filter(Boolean) as string[];

  const rvr = facts?.rawVsRendered;
  const removed: any[] = report.qa?.removed ?? [];
  const demoted: any[] = report.qa?.demoted ?? [];

  return `
    <div class="mb-8 p-6 rounded-2xl border border-slate-100 bg-white">
      <h2 class="text-lg font-bold mb-2" style="color: ${accent}">Evidence &amp; accuracy</h2>
      <p class="text-xs text-slate-500 mb-4">${escapeHtml(method)}</p>
      ${unreadable.length ? `<p class="text-[11px] text-slate-500 mb-3">${escapeHtml(unreadable.join(', '))} could not be read (the request was refused or failed), so nothing is reported about whether it exists or what it contains, and no score points were deducted for it.</p>` : ''}
      ${botRows ? `
      <h3 class="text-sm font-bold text-slate-700 mb-1">Crawler access (each crawler's own user agent)</h3>
      <table class="text-xs w-full mb-4" style="border-collapse:collapse"><tbody>${botRows}</tbody></table>
      ${botNote ? `<p class="text-[11px] text-slate-500 mb-3">${escapeHtml(botNote)}</p>` : ''}` : ''}
      ${rvr ? `
      <h3 class="text-sm font-bold text-slate-700 mb-1">Without JavaScript vs after it runs</h3>
      <p class="text-xs text-slate-600 mb-1">Raw HTML: ${escapeHtml(rvr.rawWords)} words, ${escapeHtml(rvr.rawLinks)} links. Rendered: ${escapeHtml(rvr.renderedWords)} words, ${escapeHtml(rvr.renderedLinks)} links.</p>
      <p class="text-[11px] text-slate-400 mb-1">It is commonly reported that many AI retrieval crawlers do not run JavaScript; this scan did not test each crawler individually.</p>` : ''}
      ${demoted.length ? `<p class="text-[11px] text-slate-400">${escapeHtml(demoted.length)} item(s) were moved from critical to recommended fixes because they are not measured severe defects.</p>` : ''}
      ${removed.length ? `<p class="text-[11px] text-slate-400">${escapeHtml(removed.length)} AI suggestion(s) were removed because the measured evidence contradicted them.</p>` : ''}
    </div>`;
}
