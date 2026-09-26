import React from 'react';
import { CrawlResult } from '../types';

// Every field here is optional: scans stored before these checks existed simply lack them, and
// must render as "not checked" rather than as failures.
function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
      ok ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
    }`}>{ok ? '✓' : '✗'} {label}</span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-slate-300 font-semibold shrink-0">{label}</span>
      <span className="text-slate-200 text-right break-all">{children}</span>
    </div>
  );
}

const NOT_CHECKED = <span className="text-slate-500">Not checked</span>;

export default function AdditionalChecks({ crawl }: { crawl?: CrawlResult }) {
  if (!crawl?.mainPage) return null;
  const page = crawl.mainPage;
  const sec = crawl.securityHeaders;
  const social = page.social;
  const vitals = page.webVitals;
  const chain = crawl.redirectChain;
  const broken = crawl.brokenLinks;
  const dupTitles = crawl.duplicateTitles ?? [];
  const dupDescs = crawl.duplicateDescriptions ?? [];

  const hasAnything = sec || social || vitals || chain || broken || page.lang !== undefined ||
    page.hreflang || page.wordCount !== undefined || crawl.robotsBlocksAll !== undefined;
  if (!hasAnything) return null;

  return (
    <div className="glass-card rounded-2xl p-6 shadow-lg space-y-5 animate-fadeIn">
      <h3 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-white/10 pb-2">Additional Checks</h3>

      {crawl.robotsBlocksAll && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 font-semibold">
          robots.txt disallows all crawlers (Disallow: /). Search engines cannot index this site.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Security headers</div>
          {sec ? (
            <div className="flex flex-wrap gap-1.5">
              <Chip ok={sec.https} label="HTTPS" />
              <Chip ok={sec.hsts} label="HSTS" />
              <Chip ok={sec.csp} label="CSP" />
              <Chip ok={sec.xFrameOptions} label="X-Frame-Options" />
              <Chip ok={sec.xContentTypeOptions} label="X-Content-Type-Options" />
              <Chip ok={sec.referrerPolicy} label="Referrer-Policy" />
            </div>
          ) : NOT_CHECKED}

          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black pt-2">Redirects</div>
          {chain ? (
            chain.length <= 1 ? (
              <span className="text-xs text-emerald-300 font-semibold">No redirect</span>
            ) : (
              <ol className="text-[11px] text-slate-300 space-y-1 font-mono break-all">
                {chain.map((u, i) => <li key={i}>{i + 1}. {u}</li>)}
                {chain.length > 3 && <li className="text-amber-300 font-sans font-semibold">Long chain — each hop adds latency.</li>}
              </ol>
            )
          ) : NOT_CHECKED}
        </div>

        <div className="space-y-2.5">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Page signals</div>
          <Row label="HTML lang">{page.lang === undefined ? NOT_CHECKED : (page.lang || <span className="text-red-300">Missing</span>)}</Row>
          <Row label="Word count">{page.wordCount === undefined ? NOT_CHECKED : `${page.wordCount}${page.wordCount < 300 ? ' (thin)' : ''}`}</Row>
          <Row label="Open Graph">
            {social ? (
              <span className="flex flex-wrap gap-1 justify-end">
                <Chip ok={!!social.ogTitle} label="title" />
                <Chip ok={!!social.ogDescription} label="description" />
                <Chip ok={!!social.ogImage} label="image" />
              </span>
            ) : NOT_CHECKED}
          </Row>
          <Row label="Twitter card">{social ? (social.twitterCard || <span className="text-red-300">Missing</span>) : NOT_CHECKED}</Row>
          <Row label="hreflang">
            {page.hreflang === undefined ? NOT_CHECKED : page.hreflang.length === 0 ? 'None' : page.hreflang.map(h => h.lang).join(', ')}
          </Row>
          <Row label="LCP (lab)">{vitals?.lcpMs !== undefined ? `${Math.round(vitals.lcpMs)} ms` : NOT_CHECKED}</Row>
          <Row label="CLS (lab)">{vitals?.cls !== undefined ? vitals.cls.toFixed(3) : NOT_CHECKED}</Row>
          {vitals && <p className="text-[10px] text-slate-500">Lab-measured from the scanning host, not real-user field data.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
          Broken links{broken && crawl.linksChecked !== undefined ? ` (sample of ${crawl.linksChecked} checked)` : ''}
        </div>
        {broken === undefined ? NOT_CHECKED : broken.length === 0 ? (
          <span className="text-xs text-emerald-300 font-semibold">No broken links in the sample</span>
        ) : (
          <ul className="space-y-1">
            {broken.map((b, i) => (
              <li key={i} className="text-[11px] flex gap-2 items-start">
                <span className="font-mono font-bold text-red-300 shrink-0">{b.status || 'ERR'}</span>
                <span className="text-slate-300 break-all">{b.href}</span>
                <span className="text-slate-500 shrink-0">{b.type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(dupTitles.length > 0 || dupDescs.length > 0) && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Duplicate metadata across crawled pages</div>
          {[{ label: 'Title', groups: dupTitles }, { label: 'Description', groups: dupDescs }].map(({ label, groups }) =>
            groups.map((g, i) => (
              <div key={`${label}${i}`} className="text-[11px] bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                <div className="font-bold text-amber-300">{label}: “{g.value}”</div>
                <div className="text-slate-400 break-all mt-1">{g.urls.join(' · ')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
