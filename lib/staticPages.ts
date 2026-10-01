import { escapeHtml as esc } from './email';
import { PLANS, PLAN_ORDER, yearlyPerMonth } from '../src/plans';
import { PRIVACY, TERMS, type LegalDoc } from '../src/legal/content';

// The app is a client-rendered React page, so a crawler that does not run JavaScript would receive
// an empty shell. These are static, crawlable versions of the public pages, placed inside the
// shell's root element: crawlers without JavaScript read them, and React replaces them (visually
// hidden until then) as soon as the app mounts. They describe the same content the page shows,
// and are built from the app's own data (plans, legal text) so they cannot drift from it.

// The audit stages, in order. A test checks this against the app's own list.
export const STAGE_LABELS = [
  'Resolve & validate target', 'robots.txt & sitemap', 'AI-crawler directives', 'Render the page',
  'Meta tags & canonical', 'Headings & content depth', 'Images & alt text', 'Links & broken-link sample',
  'Structured data (JSON-LD)', 'Security headers & HTTPS', 'Performance, TTFB & vitals', 'DeepSeek analysis', 'Agent-ready prompt'
];

const NAV = `<nav aria-label="Main"><a href="/">SeoScan</a> <a href="/signup">Create account</a> <a href="/login">Sign in</a> <a href="/terms">Terms</a> <a href="/privacy">Privacy</a></nav>`;
const FOOT = `<footer><a href="/terms">Terms of Service</a> <a href="/privacy">Privacy Policy</a> <a href="/signup">Create an account</a></footer>`;

const FEATURES: Array<[string, string]> = [
  ['Real-browser crawling', 'Pages render in headless Chromium, so JavaScript-built content, meta tags and structured data are read the way a visitor sees them. Single page or a deep site crawl.'],
  ['AEO / GEO readiness', 'Checks llms.txt, schema types and answer-friendly structure, tests whether 13 search and AI crawlers can fetch the page, and scores how ready the site is to be quoted by AI search.'],
  ['Security and speed checks', 'Reads HTTPS, HSTS, CSP and other headers from the real response, samples for broken links, and records time to first byte and lab Core Web Vitals.'],
  ['White-label reports', 'Your agency name, colours and footer on a downloadable PDF or HTML report. Choose which sections each client sees.'],
  ['Monitoring and alerts', 'Schedule recurring scans and get an email when a site’s score drops, with the new critical issues listed.'],
  ['Lead-capture widget', 'Embed a free-audit form on your own site. Prospects run a scan, and their contact details land in your Leads tab.']
];

const STEPS: Array<[string, string]> = [
  ['Paste a URL', 'Pick a single page or a deep crawl. Nothing to install and no code on your site.'],
  ['Watch it run', 'A live audit log shows each request and measurement as it happens. A single page usually takes 20–45 seconds; bigger or slower sites take longer.'],
  ['Ship the fixes', 'Get scored findings, remediation steps, a branded report, and a prompt you can paste into your coding agent.']
];

const FAQ: Array<[string, string]> = [
  ['What does an audit check?', 'Thirteen stages covering technical SEO, content, structured data, security headers, performance and AI-search readiness, including whether search and AI crawlers can fetch your page and what a crawler sees without JavaScript.'],
  ['How accurate are the findings and scores?', 'Scores are computed by fixed rules from measured checks, with every deduction listed, so the same site always scores the same. Each AI suggestion is checked against the evidence, and anything the site already has is removed and listed in the report.'],
  ['Is there a free plan?', 'Yes. Free includes three single-page audits every 30 days with the full AI report, fix checklist and PDF download.'],
  ['Can it scan pages behind a login?', 'No. It audits what a public visitor or search crawler can reach.']
];

const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

function home(): string {
  const plans = PLAN_ORDER.map((id) => {
    const p = PLANS[id];
    const price = id === 'FREE' ? 'Free' : `${money(p.priceMonthly)} per month, or ${money(p.priceYearly)} per year (${money(yearlyPerMonth(p))} per month billed annually)`;
    return `<h3>${esc(p.name)}</h3><p>${esc(p.tagline)}. ${esc(price)}.</p><ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`;
  }).join('');
  return `<header>${NAV}</header><main>
<h1>Find out why your site isn’t ranking in Google or AI search.</h1>
<p>SeoScan loads your site in a real browser, runs 13 audit stages across technical SEO, content, AI-answer readiness, security and speed, then hands you a branded report and a ready-made prompt for your coding agent.</p>
<p><a href="/signup">Run my first audit</a> <a href="/login">Sign in</a></p>
<h2>What every audit checks</h2><ol>${STAGE_LABELS.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>How it works</h2><ol>${STEPS.map(([t, d]) => `<li><strong>${esc(t)}.</strong> ${esc(d)}</li>`).join('')}</ol>
<h2>What you get</h2>${FEATURES.map(([t, d]) => `<h3>${esc(t)}</h3><p>${esc(d)}</p>`).join('')}
<h2>Plans and pricing</h2>${plans}
<h2>Frequently asked questions</h2>${FAQ.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}
</main>${FOOT}`;
}

function legal(doc: LegalDoc): string {
  return `<header>${NAV}</header><main><h1>${esc(doc.title)}</h1><p>Last updated ${esc(doc.updated)}</p><p>${esc(doc.summary)}</p>${doc.sections.map((s) =>
    `<h2>${esc(s.heading)}</h2>${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`).join('')}</main>${FOOT}`;
}

/** Static content for the public pages; empty for anything else (the app itself, the widget). */
export function staticContentFor(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/';
  const body = p === '/' ? home() : p === '/terms' ? legal(TERMS) : p === '/privacy' ? legal(PRIVACY) : '';
  return body ? `<div id="seo-static" class="sr-only">${body}</div>` : '';
}
