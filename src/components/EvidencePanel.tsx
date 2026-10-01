import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { CrawlResult, DeepSeekSeoReport } from '../types';
import { botVerdict, classifyBots } from '../../lib/audit/botVerdict';

// Measured evidence behind the report. Everything here comes from direct requests and parsing (see
// lib/audit), not from the AI. Scans stored before it existed have no `facts` and simply omit the
// sections that need them.

const ROLE_LABEL = { training: 'AI training', search: 'Search', assistant: 'Assistant' } as const;

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-white tabular-nums">{value}</div>
      {note && <div className="mt-0.5 text-[10px] text-slate-500">{note}</div>}
    </div>
  );
}

const CATEGORIES: Array<[keyof NonNullable<DeepSeekSeoReport['scoreBreakdown']>, string]> = [
  ['technical', 'Technical'], ['content', 'Content'], ['aeoGeo', 'AEO / GEO'], ['performance', 'Performance']
];

export default function EvidencePanel({ crawl, report }: { crawl?: CrawlResult; report?: DeepSeekSeoReport }) {
  if (!crawl?.mainPage || !report) return null;
  const facts = crawl.facts;
  const bots = facts?.botAccess;
  const rvr = facts?.rawVsRendered;
  const entities = facts?.schema?.entities ?? [];
  const invisible = facts?.schema?.invisible ?? [];
  const removed = report.qa?.removed ?? [];
  const measured = report.scoreMethod === 'measured';
  const blocked = bots?.results.filter((r) => r.blocked) ?? [];
  const cls = bots ? classifyBots(bots) : null;
  const challenge = crawl.pageKind === 'challenge';
  const unreadable = [
    crawl.robotsReadable === false && 'robots.txt',
    crawl.sitemapChecked === false && 'the sitemap',
    crawl.llmsChecked === false && 'llms.txt'
  ].filter(Boolean) as string[];
  const demoted = report.qa?.demoted ?? [];

  return (
    <div className="glass-card rounded-2xl p-6 shadow-lg space-y-6 animate-fadeIn">
      <h3 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400" /> Evidence &amp; accuracy
      </h3>

      {/* How the scores were produced */}
      <div className="space-y-3">
        <div className={`rounded-lg border p-3 text-xs ${measured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : report.scoreMethod === 'illustrative' ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>
          {measured && 'Scores are computed by fixed rules from the checks measured in this scan, not estimated by an AI. Every deduction is listed below, so the same site always scores the same.'}
          {report.scoreMethod === 'illustrative' && (challenge
            ? `The site served a bot challenge${crawl.challengeReason ? ` (${crawl.challengeReason})` : ''}, so the real page could not be audited. The scores are illustrative placeholders, not measurements.`
            : 'The site could not be reached, so these scores are illustrative placeholders, not measurements.')}
          {!report.scoreMethod && 'This report predates computed scores: its numbers were estimated by the AI model and can vary between runs. Re-run the audit for measured scores.'}
        </div>
        {measured && report.scoreBreakdown && (
          <details className="group rounded-lg border border-white/10 bg-white/[0.02]">
            <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold text-slate-200 hover:text-white">Show how each score was calculated</summary>
            <div className="grid gap-4 px-4 pb-4 md:grid-cols-2">
              {CATEGORIES.map(([key, label]) => {
                const deductions = report.scoreBreakdown![key];
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{label}</span><span className="tabular-nums">{report.score[key]}/100</span>
                    </div>
                    {deductions.length === 0 ? (
                      <p className="mt-1 text-[11px] text-emerald-300">No deductions: nothing measured against this score.</p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
                        {deductions.map((d) => (
                          <li key={d.reason} className="flex gap-2"><span className="w-8 shrink-0 text-right font-mono text-rose-300">−{d.points}</span><span>{d.reason}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {unreadable.length > 0 && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-[11px] text-amber-100">
          {unreadable.join(', ')} could not be read (the request was refused or failed), so nothing is reported about whether {unreadable.length === 1 ? 'it exists' : 'they exist'} or what {unreadable.length === 1 ? 'it contains' : 'they contain'}, and no score points were deducted for it.
        </p>
      )}

      {/* Crawler access */}
      {bots && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Crawler access (tested with each crawler&rsquo;s own user agent)</div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-slate-400 text-left">
                <tr><th className="px-3 py-2 font-semibold">Crawler</th><th className="px-3 py-2 font-semibold">Type</th><th className="px-3 py-2 font-semibold">Result</th><th className="px-3 py-2 font-semibold">robots.txt</th></tr>
              </thead>
              <tbody>
                {bots.results.map((r) => {
                  const verdict = botVerdict(r, bots);
                  const label = verdict === 'ok' ? `OK (${r.status})`
                    : verdict === 'inconclusive' ? `Refused, cannot confirm (${r.status || 'no response'})`
                    : verdict === 'policy' ? `Refused, as robots.txt asks (${r.status || 'no response'})`
                    : `Blocked (${r.status || 'no response'})`;
                  const tone = verdict === 'ok' ? 'text-emerald-300' : verdict === 'genuine' ? 'text-rose-300' : 'text-amber-200';
                  return (
                  <tr key={r.name} className="border-t border-white/5">
                    <td className="px-3 py-1.5 font-semibold text-slate-200">{r.name}</td>
                    <td className="px-3 py-1.5 text-slate-400">{ROLE_LABEL[r.role]}</td>
                    <td className={`px-3 py-1.5 font-bold ${tone}`}>{label}</td>
                    <td className="px-3 py-1.5 text-slate-400">{r.robotsAllows === null ? 'unreadable' : r.robotsAllows ? 'allowed' : 'disallowed'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {cls.conflicts.length > 0 && (
            <p className="text-[11px] text-amber-200">robots.txt allows {cls.conflicts.join(', ')}, but the site refuses them anyway (often a CDN bot-protection setting).</p>
          )}
          {cls.inconclusive.length > 0 && (
            <p className="text-[11px] text-amber-200">
              {bots.baselineRefused
                ? 'The site refuses ordinary non-browser requests too, so these results cannot show which crawlers are welcome.'
                : `${cls.inconclusive.map((r) => r.name).join(', ')} refused an imitation of their user agent. These crawlers are verified by IP address, so that is expected and does not show they are blocked.`}
              {' '}To confirm, check Google Search Console, Bing Webmaster Tools or your server logs. These refusals cost no score points.
            </p>
          )}
          {cls.policy.length > 0 && (
            <p className="text-[11px] text-slate-400">{cls.policy.map((r) => r.name).join(', ')} {cls.policy.length === 1 ? 'is' : 'are'} disallowed in robots.txt and also refused: that is the site&rsquo;s own policy being enforced, not an error.</p>
          )}
          {blocked.length > 0 && blocked.every((r) => r.role === 'training') && cls.inconclusive.length === 0 && (
            <p className="text-[11px] text-slate-400">Only AI-training crawlers are refused; search and assistant crawlers get through, so answer-engine citation is not blocked. Whether to block training crawlers is the owner&rsquo;s choice.</p>
          )}
        </div>
      )}

      {/* Raw vs rendered */}
      {rvr && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">What a crawler sees without JavaScript vs after it runs</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Words, raw HTML" value={rvr.rawWords} />
            <Stat label="Words, rendered" value={rvr.renderedWords} />
            <Stat label="Links, raw" value={rvr.rawLinks} note="real &lt;a href&gt;" />
            <Stat label="Links, rendered" value={rvr.renderedLinks} note="real &lt;a href&gt;" />
          </div>
          {rvr.schemaOnlyAfterJs.length > 0 && <p className="text-[11px] text-amber-200">Structured data that only exists after JavaScript runs: {rvr.schemaOnlyAfterJs.join(', ')}.</p>}
          {rvr.navButtons > rvr.navAnchors && <p className="text-[11px] text-amber-200">Header, navigation and footer contain {rvr.navButtons} buttons but only {rvr.navAnchors} real links; crawlers do not click buttons.</p>}
          <p className="text-[11px] text-slate-500">It is commonly reported that many AI retrieval crawlers do not run JavaScript. This scan did not test each crawler individually.</p>
        </div>
      )}

      {/* Structured data */}
      {entities.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Structured data found</div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(entities.map((e) => e.type))).map((t) => (
              <span key={t} className="rounded border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-200">{t}</span>
            ))}
          </div>
          {invisible.map((inv) => (
            <p key={inv.type} className="text-[11px] text-amber-200">{inv.type} markup describes {inv.items.length} of {inv.total} item(s) that are not visible on the page, e.g. &ldquo;{inv.items[0]}&rdquo;.</p>
          ))}
        </div>
      )}

      {demoted.length > 0 && (
        <details className="rounded-lg border border-white/10 bg-white/[0.02]">
          <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold text-slate-200 hover:text-white">
            {demoted.length} item{demoted.length === 1 ? ' was' : 's were'} moved from critical to recommended fixes (not a measured severe defect)
          </summary>
          <ul className="space-y-2 px-4 pb-4 text-[11px] text-slate-300">
            {demoted.map((r, i) => <li key={i}><span className="font-semibold text-slate-200">{r.title}</span></li>)}
          </ul>
        </details>
      )}

      {/* What the checker removed */}
      {removed.length > 0 && (
        <details className="rounded-lg border border-white/10 bg-white/[0.02]">
          <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold text-slate-200 hover:text-white">
            {removed.length} AI suggestion{removed.length === 1 ? ' was' : 's were'} removed because the evidence contradicted {removed.length === 1 ? 'it' : 'them'}
          </summary>
          <ul className="space-y-2 px-4 pb-4 text-[11px] text-slate-300">
            {removed.map((r, i) => (
              <li key={i}><span className="font-semibold text-slate-200">{r.title}</span><span className="text-slate-500"> — {r.reason}</span></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
