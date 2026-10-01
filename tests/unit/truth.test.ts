import { describe, it, expect } from 'vitest';
import type { CrawlResult, DeepSeekSeoReport, BotAccessResult } from '../../src/types';
import { finalizeReport } from '../../lib/audit/finalize';
import { computeScores } from '../../lib/audit/scoring';
import { contradiction } from '../../lib/audit/contradiction';
import { contentSignals } from '../../lib/audit/contentSignals';
import { botVerdict } from '../../lib/audit/botVerdict';
import { parseModelJson, firstJsonObject } from '../../lib/deepseek';

function crawl(over: Partial<CrawlResult> = {}, page: Partial<CrawlResult['mainPage']> = {}): CrawlResult {
  return {
    rootUrl: 'https://site.test/', mode: 'SINGLE', depth: 1, timestamp: 't',
    mainPage: {
      url: 'https://site.test/', loadTimeMs: 600, ttfbMs: 100, pageSizeKb: 40, status: 200,
      meta: { title: 'Site', description: 'A description', keywords: '', viewport: 'width=device-width', robots: '', canonical: 'https://site.test/' },
      headings: { h1: ['Hello'], h2: ['One', 'Two', 'Three'], h3: [] },
      images: { total: 10, missingAlt: 7, noAltAttribute: 0, emptyAlt: 7, list: [] },
      links: { total: 1, internal: 1, external: 0, list: [] },
      structuredData: { hasJsonLd: true, types: ['Organization'] },
      lang: 'en', wordCount: 800,
      social: { ogTitle: 'x', ogDescription: 'x', ogImage: 'x', ogType: 'website', twitterCard: 'summary' },
      ...page
    },
    additionalPages: [], sitemapFound: true, llmsTxtFound: true, hasSimulatedData: false,
    securityHeaders: { https: true, hsts: true, csp: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true },
    facts: {},
    ...over
  } as CrawlResult;
}

function draft(over: Partial<DeepSeekSeoReport> = {}): DeepSeekSeoReport {
  return {
    score: { overall: 80, technical: 80, content: 80, aeoGeo: 80, performance: 80 },
    executiveSummary: 'The site has 3 of 14 images missing alt text and a $99 plan.',
    criticalIssues: ['3 of 14 images are missing alt text', 'Pricing is $99 and has no markup'],
    recommendedFixes: [{ title: 'Add alt text', category: 'content', priority: 'high', description: '3 of 14 images have no alt attribute', remediation: 'Add alt.' }],
    aeoAssessment: { generativeFriendlinessScore: 80, directAnswerFriendliness: 'ok', richSnippetEligibility: ['Product'], voiceSearchOptimized: true, recommendationsForAeo: ['Add FAQ'] },
    competitorComparisonText: 'Better than rivals',
    ...over
  };
}

const bot = (name: string, role: BotAccessResult['role'], over: Partial<BotAccessResult> = {}): BotAccessResult => ({ name, role, status: 200, blocked: false, robotsAllows: true, ...over });
const botsFact = (results: BotAccessResult[], extra: Record<string, unknown> = {}) => ({ checkedUrl: 'https://site.test/', baselineStatus: 200, results, conflicts: results.filter((r) => r.blocked && r.robotsAllows === true).map((r) => r.name), ...extra });
const withBots = (results: BotAccessResult[], extra: Record<string, unknown> = {}) => crawl({ facts: { botAccess: botsFact(results, extra) } as any });

describe('A-04 unreachable site: honest report, nothing from placeholder data', () => {
  const sim = crawl({ hasSimulatedData: true });
  const out = finalizeReport(draft(), sim);
  it('says live data could not be retrieved and is illustrative', () => {
    expect(out.scoreMethod).toBe('illustrative');
    expect(out.executiveSummary).toMatch(/could not be retrieved/);
    expect(out.executiveSummary).not.toMatch(/\$99|images/);
  });
  it('has exactly one critical line and only actionable fixes', () => {
    expect(out.criticalIssues).toHaveLength(1);
    expect(out.criticalIssues[0]).toMatch(/could not be read/);
    expect(out.recommendedFixes.map((f) => f.title).join(' ')).toMatch(/bot protection/i);
    expect(JSON.stringify({ ...out, qa: undefined })).not.toMatch(/3 of 14|\$99/);
    expect(out.qa?.removed.length).toBe(3);
  });
  it('rebuilds the hand-off prompt from the honest report', () => {
    expect(out.agentReadyPrompt?.prompt).toMatch(/could not read/);
    expect(out.agentReadyPrompt?.prompt).not.toMatch(/3 of 14|\$99/);
  });
  it('treats a bot-challenge page the same way and names the reason', () => {
    const ch = finalizeReport(draft(), crawl({ pageKind: 'challenge', challengeReason: 'Just a moment (Cloudflare)' }, { meta: { title: 'Just a moment...', description: '', keywords: '', viewport: '', robots: '', canonical: '' } }));
    expect(ch.criticalIssues).toEqual(['The site served a bot challenge (Just a moment (Cloudflare)) so the real page could not be audited.']);
    expect(ch.scoreMethod).toBe('illustrative');
    expect(JSON.stringify(ch)).not.toMatch(/Just a moment\.\.\./);
  });
});

describe('A-02 consumption: inconclusive and policy refusals', () => {
  it('classifies refusals', () => {
    const b = { baselineRefused: false };
    expect(botVerdict(bot('X', 'search'), b)).toBe('ok');
    expect(botVerdict(bot('X', 'search', { blocked: true, inconclusive: true }), b)).toBe('inconclusive');
    expect(botVerdict(bot('X', 'search', { blocked: true }), { baselineRefused: true })).toBe('inconclusive');
    expect(botVerdict(bot('X', 'assistant', { blocked: true, robotsAllows: false }), b)).toBe('policy');
    expect(botVerdict(bot('X', 'search', { blocked: true }), b)).toBe('genuine');
  });
  const results = [bot('Googlebot', 'search', { blocked: true, status: 403, inconclusive: true }), bot('Bingbot', 'search', { blocked: true, status: 403, inconclusive: true }), bot('OAI-SearchBot', 'search')];
  it('inconclusive refusals are not critical and cost no AEO points', () => {
    const c = withBots(results);
    const base = computeScores(withBots([bot('Googlebot', 'search'), bot('Bingbot', 'search'), bot('OAI-SearchBot', 'search')]));
    expect(computeScores(c).score.aeoGeo).toBe(base.score.aeoGeo);
    const out = finalizeReport(draft({ criticalIssues: ['Googlebot is blocked, a real loss of visibility'] }), c);
    expect(out.criticalIssues.join(' ')).not.toMatch(/Googlebot|crawlers are refused/);
    const fix = out.recommendedFixes.find((f) => /could not tell/.test(f.title))!;
    expect(fix.priority).toBe('low');
    expect(fix.description + fix.remediation).toMatch(/Search Console/);
    expect(fix.description + fix.remediation).toMatch(/Bing Webmaster Tools/);
    expect(fix.description).toMatch(/cannot be concluded/);
  });
  it('a site that refuses every non-browser client is inconclusive for all', () => {
    const c = withBots([bot('OAI-SearchBot', 'search', { blocked: true, status: 403 })], { baselineRefused: true });
    expect(computeScores(c).breakdown.aeoGeo).toHaveLength(0);
    expect(finalizeReport(draft({ criticalIssues: [] }), c).criticalIssues).toEqual([]);
  });
  it('a genuine block of a search crawler is still critical, high and scored', () => {
    const c = withBots([bot('OAI-SearchBot', 'search', { blocked: true, status: 403 })]);
    expect(computeScores(c).breakdown.aeoGeo.length).toBeGreaterThan(0);
    const out = finalizeReport(draft({ criticalIssues: [] }), c);
    expect(out.criticalIssues[0]).toMatch(/OAI-SearchBot/);
    expect(out.recommendedFixes.find((f) => /Let search/.test(f.title))?.priority).toBe('high');
  });
});

describe('A-15 refusal that robots.txt itself asks for is policy', () => {
  const results = [bot('GPTBot', 'training', { blocked: true, status: 403, robotsAllows: false }), bot('Perplexity-User', 'assistant', { blocked: true, status: 403, robotsAllows: false }), bot('Googlebot', 'search')];
  const c = withBots(results);
  it('costs no points and raises no finding', () => {
    expect(computeScores(c).breakdown.aeoGeo).toHaveLength(0);
    const out = finalizeReport(draft({ criticalIssues: ['Perplexity-User blocked, real loss of assistant visibility', 'The crawler policy is ambiguous'], recommendedFixes: [{ title: 'Let search and assistant crawlers through your CDN', category: 'aeo-geo', priority: 'high', description: 'Perplexity-User is blocked', remediation: 'Allow user agents' }] }), c);
    expect(out.criticalIssues.join(' ')).not.toMatch(/Perplexity/);
    expect(out.recommendedFixes.some((f) => f.priority === 'high' && /crawler/i.test(f.title))).toBe(false);
    expect(out.qa?.added.join(' ')).toMatch(/consistent with the site's policy/);
  });
  it('drops "robots.txt does not explicitly disallow X" when it does', () => {
    expect(contradiction('robots.txt does not explicitly disallow gptbot, so the policy is unclear', c)).toMatch(/explicitly disallows GPTBot/);
    expect(contradiction('robots.txt does not explicitly disallow claudebot', c)).toBeNull();
  });
});

describe('A-01 consumption: unreadable robots/sitemap/llms', () => {
  const c = crawl({ sitemapFound: false, llmsTxtFound: false, sitemapChecked: false, llmsChecked: false, robotsReadable: false });
  it('does not deduct for a sitemap or llms.txt that could not be read', () => {
    const reasons = Object.values(computeScores(c).breakdown).flat().map((d) => d.reason).join(' ');
    expect(reasons).not.toMatch(/sitemap|llms/);
    const checked = computeScores(crawl({ sitemapFound: false, llmsTxtFound: false })).breakdown;
    expect([...checked.technical, ...checked.aeoGeo].map((d) => d.reason).join(' ')).toMatch(/sitemap[\s\S]*llms|llms[\s\S]*sitemap/);
  });
  it('drops model claims that they are missing', () => {
    expect(contradiction('add a sitemap.xml: no sitemap was found', c)).toMatch(/sitemap/);
    expect(contradiction('create an llms.txt file', c)).toMatch(/llms/);
    expect(contradiction('robots.txt has no rules for ai crawlers', c)).toMatch(/robots\.txt could not be read/);
    const out = finalizeReport(draft({ criticalIssues: ['Sitemap.xml was not found'], recommendedFixes: [] }), c);
    expect(out.criticalIssues.join(' ')).not.toMatch(/sitemap/i);
  });
  it('still reports a sitemap that was checked and is absent', () => {
    expect(contradiction('add a sitemap.xml: no sitemap was found', crawl({ sitemapFound: false }))).toBeNull();
  });
});

describe('A-05 navigation labels count only when they are in-page anchors', () => {
  it('a footer link to another page is not a visible FAQ section', () => {
    expect(contentSignals('<footer><a href="/faq">faq</a><a href="https://x.test/help">Contact</a></footer>', '', 0).sections.faq).toBe(false);
    expect(contentSignals('<footer><a href="/faq">faq</a></footer>', '', 0).sections.contact).toBe(false);
  });
  it('an in-page anchor still counts, as does a heading', () => {
    expect(contentSignals('<nav><a href="#faq">FAQ</a></nav>', '', 0).sections.faq).toBe(true);
    expect(contentSignals('<nav><a href="#how">How it works</a></nav>', '', 0).sections.howItWorks).toBe(true);
    expect(contentSignals('<h2>FAQ</h2>', '', 0).sections.faq).toBe(true);
  });
  it('a button carries no href and proves nothing', () => {
    expect(contentSignals('<nav><button>FAQ</button></nav>', '', 0).sections.faq).toBe(false);
  });
});

describe('A-06 model JSON followed by extra text', () => {
  const obj = { a: 1, b: ['x', { c: 'y' }] };
  it('parses plain JSON', () => expect(parseModelJson(JSON.stringify(obj))).toEqual(obj));
  it('ignores trailing prose', () => expect(parseModelJson(`${JSON.stringify(obj)}\n\nHope this helps! {not json}`)).toEqual(obj));
  it('strips fences', () => expect(parseModelJson('```json\n' + JSON.stringify(obj) + '\n```')).toEqual(obj));
  it('fences plus trailing prose', () => expect(parseModelJson('```json\n' + JSON.stringify(obj) + '\n```\nNote: done')).toEqual(obj));
  it('is not fooled by braces and quotes inside strings', () => {
    const tricky = { t: 'a } b { "c" \\ d', u: '}}}' };
    expect(parseModelJson(JSON.stringify(tricky) + ' trailing } text')).toEqual(tricky);
    expect(firstJsonObject('{"a":"}"} x')).toBe('{"a":"}"}');
  });
  it('fails (so the caller can fall back) when there is no object', () => {
    expect(() => parseModelJson('no json here')).toThrow();
    expect(() => parseModelJson('{"a": ')).toThrow();
  });
});

describe('A-07 opening text as evidence', () => {
  const html = '<html><body><nav>Menu Home</nav><main><h1>Title</h1><p>' + 'word '.repeat(300) + '</p></main><footer>Foot</footer></body></html>';
  it('computes the first ~120 words of <main>', () => {
    const t = contentSignals(html, '', 0).openingText!;
    expect(t.split(' ')).toHaveLength(120);
    expect(t.startsWith('Title word')).toBe(true);
    expect(t).not.toMatch(/Menu|Foot/);
  });
  it('falls back to the body', () => {
    expect(contentSignals('<body><p>Hello there friend</p></body>', '', 0).openingText).toBe('Hello there friend');
  });
  it('drops "no direct answer / definition" claims when no opening text was provided', () => {
    const c = crawl({ facts: { signals: { sections: {}, prices: [], hasVisibleReviews: false, multiLanguage: false } as any } });
    expect(contradiction('there is no concise definition block near the top of the page', c)).toMatch(/opening text/);
    expect(contradiction('the page lacks a direct answer to the main question', c)).toMatch(/opening text/);
  });
  it('keeps the claim when the evidence includes the opening text', () => {
    const c = crawl({ facts: { signals: { sections: {}, prices: [], hasVisibleReviews: false, multiLanguage: false, openingText: 'Welcome to our site.' } as any } });
    expect(contradiction('there is no concise definition block near the top of the page', c)).toBeNull();
  });
});

describe('A-08 alt text: only a missing attribute is a defect', () => {
  it('scoring ignores alt="" and counts noAltAttribute', () => {
    expect(computeScores(crawl()).breakdown.content.some((d) => /alt/.test(d.reason))).toBe(false);
    const d = computeScores(crawl({}, { images: { total: 10, missingAlt: 7, noAltAttribute: 5, emptyAlt: 2, list: [] } })).breakdown.content.find((x) => /alt/.test(x.reason))!;
    expect(d.reason).toBe('5 of 10 images have no alt attribute');
  });
  it('falls back to missingAlt on older scans', () => {
    const d = computeScores(crawl({}, { images: { total: 10, missingAlt: 4, list: [] } })).breakdown.content.find((x) => /alt/.test(x.reason));
    expect(d?.reason).toMatch(/^4 of 10/);
  });
  it('contradiction: a fix may not claim empty alts have no attribute', () => {
    const c = crawl({}, { images: { total: 24, missingAlt: 17, noAltAttribute: 0, emptyAlt: 17, list: [] } });
    expect(contradiction('17 of 24 images have no alt attribute', c)).toMatch(/only 0 do/);
    expect(contradiction('add alt text: images are missing alt', c)).toMatch(/every image has an alt attribute/);
    const c2 = crawl({}, { images: { total: 24, missingAlt: 17, noAltAttribute: 3, emptyAlt: 14, list: [] } });
    expect(contradiction('17 of 24 images have no alt attribute', c2)).toMatch(/only 3 do/);
    expect(contradiction('3 of 24 images have no alt attribute', c2)).toBeNull();
  });
});

describe('A-13 severity calibration', () => {
  const c = crawl({}, { meta: { title: 'Site', description: 'd', keywords: '', viewport: 'v', robots: '', canonical: 'c' } });
  it('demotes minor "criticals" into fixes once, recording it', () => {
    const out = finalizeReport(draft({ criticalIssues: ['Title tag has an unnecessary brand suffix', 'Sitemap lastmod values are all identical'], recommendedFixes: [] }), c);
    expect(out.criticalIssues).toEqual([]);
    expect(out.recommendedFixes.map((f) => f.title).join('|')).toMatch(/brand suffix/);
    expect(out.recommendedFixes.find((f) => /brand suffix/.test(f.title))?.priority).toBe('low');
    expect(out.recommendedFixes.filter((f) => /brand suffix/.test(f.title))).toHaveLength(1);
    expect(out.qa?.demoted).toHaveLength(2);
  });
  it('does not duplicate a fix that already covers it', () => {
    const out = finalizeReport(draft({ criticalIssues: ['Meta description is too short'], recommendedFixes: [{ title: 'Lengthen the meta description', category: 'content', priority: 'medium', description: 'Meta description is too short', remediation: 'x' }] }), c);
    expect(out.criticalIssues).toEqual([]);
    expect(out.recommendedFixes).toHaveLength(1);
  });
  it('keeps measured severe conditions critical', () => {
    const severe = crawl({ robotsBlocksAll: true, securityHeaders: { https: false, hsts: false, csp: false, xFrameOptions: false, xContentTypeOptions: false, referrerPolicy: false } }, { meta: { title: '', description: '', keywords: '', viewport: '', robots: 'noindex', canonical: '' }, headings: { h1: [], h2: [], h3: [] } });
    const out = finalizeReport(draft({ criticalIssues: ['robots.txt blocks the whole site', 'The page carries a noindex tag', 'Site is served over plain HTTP', 'The page has no title tag', 'There is no H1 heading', 'Footer font is slightly small'], recommendedFixes: [] }), severe);
    expect(out.criticalIssues).toHaveLength(5);
    expect(out.criticalIssues.join(' ')).not.toMatch(/font/);
    expect(out.qa?.demoted).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------
// Second batch: reviewer-found report-side defects.

import { vi } from 'vitest';
import { contentSignalOf, localeLinksOf } from '../../lib/audit/contentSignals';
import { plainEnglish } from '../../lib/audit/finalize';

const signals = (over: Record<string, unknown> = {}) => ({ sections: { pricing: false, faq: false, howItWorks: false, features: false, about: false, contact: false, reviews: false }, prices: [], hasVisibleReviews: false, multiLanguage: false, openingText: 'x', ...over }) as any;
const withFacts = (facts: Record<string, unknown>, over: Partial<CrawlResult> = {}, page: Partial<CrawlResult['mainPage']> = {}) => crawl({ facts: facts as any, ...over }, page);

describe('N-01 / N-02 / N-03 / R3-09 offline fallback', () => {
  async function offline(c: CrawlResult, fetchBody?: string) {
    vi.resetModules();
    if (fetchBody === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = 'test-key';
    const g = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: fetchBody } }] }), text: async () => '' }));
    vi.stubGlobal('fetch', g);
    const mod = await import('../../lib/deepseek');
    const out = await mod.generateSeoReport(c);
    vi.unstubAllGlobals();
    delete process.env.DEEPSEEK_API_KEY;
    return out;
  }
  it('a reply that fails to parse still gets the fact-check and measured scores', async () => {
    const out = await offline(crawl(), 'this is not json at all');
    expect(out.scoreMethod).toBe('measured');
    expect(out.qa).toBeDefined();
    expect(out.scoreBreakdown).toBeDefined();
  });
  it('makes no unsupported claims about a fast, well-formed page', async () => {
    const c = crawl({}, { loadTimeMs: 1100, ttfbMs: 276, webVitals: { lcpMs: 956, cls: 0 } });
    const out = await offline(c);
    const text = JSON.stringify(out);
    expect(text).not.toMatch(/Excellent|solid keyword density|2026 search speed|compressing static assets|Strengthen Answer/);
    expect(out.competitorComparisonText).toBeUndefined();
    expect(out.aeoAssessment.voiceSearchOptimized).toBe(false);
    expect(out.criticalIssues.join(' ')).not.toMatch(/slow|delay/i);
    expect(out.recommendedFixes.map((f) => f.title).join(' ')).not.toMatch(/Core Asset Performance/);
  });
  it('flags speed only from TTFB or LCP evidence', async () => {
    const out = await offline(crawl({}, { ttfbMs: 1400, webVitals: { lcpMs: 3000 } }));
    const f = out.recommendedFixes.find((x) => x.category === 'performance')!;
    expect(f.description).toMatch(/time to first byte 1400 ms/);
    expect(out.criticalIssues.join(' ')).not.toMatch(/ms/);
  });
});

describe('N-04 / R5 simulated and challenge reports', () => {
  it('keeps what was really read (robots.txt disallows) and gives no llms.txt advice', () => {
    const out = finalizeReport(draft(), crawl({ hasSimulatedData: true, robotsByCrawler: { GPTBot: 'disallowed', Googlebot: 'allowed', ClaudeBot: 'disallowed' } as any }));
    expect(out.executiveSummary).toMatch(/robots\.txt disallows GPTBot, ClaudeBot/);
    expect(JSON.stringify(out)).not.toMatch(/llms\.txt/);
    expect(JSON.stringify({ ...out, qa: undefined })).not.toMatch(/Leading Solutions|LocalBusiness|Frequently Asked/);
  });
  it('a challenge report does not quote an HTTP status for the interstitial', () => {
    const out = finalizeReport(draft(), crawl({ pageKind: 'challenge', challengeReason: 'Unsupported client' }));
    expect(out.executiveSummary).toMatch(/Unsupported client/);
    expect(out.executiveSummary).not.toMatch(/HTTP 4\d\d/);
  });
});

describe('N-06 / R4-02 section signals are not fooled by nav links, headlines or donation banners', () => {
  it('a Pricing nav link to another page is not a pricing section', () => {
    expect(contentSignals('<nav><a href="/pricing">Pricing</a></nav><h1>Build fast</h1>', 'Build fast. Contact sales.', 0).sections.pricing).toBe(false);
  });
  it('a news homepage is not credited with FAQ, reviews or pricing', () => {
    const html = '<h2>Why I asked myself two magic questions and they set me free from everything</h2><h3>Book review: a long and winding novel about love and loss</h3><h2>Support the Guardian</h2>';
    const s = contentSignals(html, 'Support the Guardian. Contribute $10 per month to our journalism.', 0);
    expect(s.sections.faq).toBe(false);
    expect(s.sections.reviews).toBe(false);
    expect(s.sections.pricing).toBe(false);
  });
  it('real section headings and plan prices still count', () => {
    expect(contentSignals('<h2>Frequently asked questions</h2><h2>Customer reviews</h2>', '', 0).sections).toMatchObject({ faq: true, reviews: true });
    expect(contentSignals('<h2>Plans</h2>', 'Pro plan $49 per month', 0).sections.pricing).toBe(true);
    expect(contentSignals('', 'Choose a plan: Starter $19 per month, billed yearly', 0).sections.pricing).toBe(true);
  });
});

describe('N-07 / N-10 locales and Content-Signal', () => {
  const html = '<a href="/de/">Deutsch</a><a href="/fr/">Francais</a><a href="/pt-BR/">Portugues</a><a href="https://other.test/es/">x</a><a href="/about/">About</a>';
  it('detects a language switcher and treats the site as multi-language', () => {
    expect(localeLinksOf(html)).toEqual(['/de', '/fr', '/pt-br']);
    expect(contentSignals(html, '', 0).multiLanguage).toBe(true);
    expect(contentSignals('<a href="/de/">x</a>', '', 0).multiLanguage).toBe(false);
  });
  it('keeps the hreflang suggestion and adds the measured gap', () => {
    const c = withFacts({ signals: signals({ multiLanguage: true, localeLinks: ['/de', '/fr', '/es'] }) });
    expect(contradiction('add hreflang annotations for your language versions', c)).toBeNull();
    expect(contradiction('the page is acceptable for a single-language site', c)).toMatch(/not single-language/);
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), c);
    expect(out.recommendedFixes.map((f) => f.title).join(' ')).toMatch(/hreflang/);
  });
  it('parses Content-Signal and refuses to praise training access', () => {
    expect(contentSignalOf('User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no\n')).toEqual({ search: true, aiInput: true, aiTrain: false });
    expect(contentSignalOf('User-agent: *\nAllow: /')).toBeUndefined();
    const c = withFacts({ signals: signals({ contentSignal: { aiTrain: false } }) });
    expect(contradiction('the allow-all robots.txt is optimal for training crawlers', c)).toMatch(/ai-train=no/);
  });
});

describe('N-14 sitemap deduction is surfaced', () => {
  it('adds a finding when the sitemap was checked and absent, not when unreadable', () => {
    const a = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), crawl({ sitemapFound: false }));
    expect(a.recommendedFixes.map((f) => f.title).join(' ')).toMatch(/sitemap/i);
    const b = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), crawl({ sitemapFound: false, sitemapChecked: false }));
    expect(b.recommendedFixes.map((f) => f.title).join(' ')).not.toMatch(/sitemap/i);
  });
});

describe('N4 / R3 robots.txt disallows are policy', () => {
  const c = withBots([bot('GPTBot', 'training', { blocked: true, status: 403, robotsAllows: false }), bot('Amazonbot', 'search')]);
  it('never advises allowing a crawler robots.txt disallows, nor says robots.txt allows it', () => {
    expect(contradiction('add explicit allow rules in robots.txt for gptbot', c)).toMatch(/explicitly disallows GPTBot/);
    expect(contradiction('robots.txt allows gptbot but the cdn blocks it', c)).toMatch(/explicitly disallows GPTBot/);
    expect(contradiction('do not allow gptbot unless you want training', c)).toBeNull();
  });
  it('an unreadable robots.txt supports no statement about what it allows', () => {
    const u = crawl({ robotsReadable: false });
    expect(contradiction('robots.txt allows these crawlers but the site blocks them', u)).toMatch(/could not be read/);
    expect(contradiction('robots.txt disallows every crawler', u)).toMatch(/could not be read/);
  });
  it('crawler fix wording is grammatical and names only genuinely blocked crawlers', () => {
    const one = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), withBots([bot('Bytespider', 'training', { blocked: true, status: 429 }), bot('Googlebot', 'search', { blocked: true, status: 403, inconclusive: true })]));
    const train = one.recommendedFixes.find((f) => /AI-training/.test(f.title))!;
    expect(train.description).toMatch(/^Bytespider \(HTTP 429\) was refused/);
    expect(train.description).not.toMatch(/Googlebot/);
    const two = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), withBots([bot('OAI-SearchBot', 'search', { blocked: true, status: 403 }), bot('PerplexityBot', 'search', { blocked: true, status: 403 })]));
    expect(two.recommendedFixes.find((f) => /Let search/.test(f.title))!.description).toMatch(/were refused when requesting the home page with their published user agent/);
  });
});

describe('R2 / R3 / R4 checker rules', () => {
  const base = crawl();
  it('N9: a subtype counts as Organization', () => {
    const c = withFacts({ schema: { entities: [{ type: 'Corporation', props: ['name'], prices: [], stepNames: [], questions: [], hasRating: false, hasReview: false }], invisible: [] }, signals: signals() });
    expect(contradiction('add organization schema markup with logo and sameas', c)).toMatch(/subtype/);
  });
  it('N10: customer stories exist', () => {
    const c = withFacts({ signals: signals({ customerStories: true }) });
    expect(contradiction('add case studies and testimonials to build social proof', c)).toMatch(/customer stories/);
    expect(contentSignals('<h2>Customer stories</h2>', '', 0).customerStories).toBe(true);
    expect(contentSignals('<h2>Hello</h2>', 'Plain text', 0).customerStories).toBe(false);
  });
  it('N11 / R3-04: navigation buttons next to a full set of real links are not a finding', () => {
    const rvr = { rawStatus: 200, rawBytes: 1, rawWords: 800, rawLinks: 60, rawSchemaTypes: [], renderedWords: 800, renderedLinks: 60, renderedSchemaTypes: [], schemaOnlyAfterJs: [], navButtons: 5, navAnchors: 22 };
    expect(contradiction('audit the 4 nav buttons in the navigation', withFacts({ rawVsRendered: rvr, signals: signals() }))).toMatch(/real links/);
    expect(computeScores(withFacts({ rawVsRendered: rvr })).breakdown.aeoGeo.map((d) => d.reason).join(' ')).not.toMatch(/buttons/);
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [] }), withFacts({ rawVsRendered: rvr }));
    expect(out.recommendedFixes.map((f) => f.title).join(' ')).not.toMatch(/real links/);
    const none = { ...rvr, navAnchors: 0, rawLinks: 3, renderedLinks: 40 };
    expect(computeScores(withFacts({ rawVsRendered: none })).breakdown.aeoGeo.map((d) => d.reason).join(' ')).toMatch(/buttons/);
  });
  it('N12: retired Google features are never offered', () => {
    expect(contradiction('add searchaction to become eligible for the sitelinks search box', base)).toMatch(/retired/);
    expect(contradiction('the markup makes you eligible for faq rich results', base)).toMatch(/no longer shown/);
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [{ title: 'Add FAQPage schema', category: 'aeo-geo', priority: 'high', description: 'The page has visible questions with answers.', remediation: 'Add FAQPage JSON-LD.' }] }), withFacts({ signals: signals({ sections: { faq: true } }) }));
    expect(out.recommendedFixes.find((f) => /FAQPage/.test(f.title))?.priority).toBe('low');
  });
  it('N13: llms.txt is capped at low priority with an honest note', () => {
    const out = finalizeReport(draft({ criticalIssues: ['No llms.txt file, hurting AI retrieval'], recommendedFixes: [{ title: 'Add an llms.txt file', category: 'aeo-geo', priority: 'high', description: 'Improves retrieval accuracy in ChatGPT.', remediation: 'Publish llms.txt' }] }), crawl({ llmsTxtFound: false }));
    const f = out.recommendedFixes.find((x) => /llms\.txt/.test(x.title))!;
    expect(f.priority).toBe('low');
    expect(f.description).toMatch(/optional/);
    expect(out.criticalIssues.join(' ')).not.toMatch(/llms/);
  });
  it('R4-05: "about" as a preposition is not an About section; paired criticals follow removed fixes', () => {
    expect(contradiction('add an llms.txt file to guide ai models about your content', withFacts({ signals: signals({ sections: { about: true } }) }))).toBeNull();
    expect(contradiction('add an about section to the page', withFacts({ signals: signals({ sections: { about: true } }) }))).toMatch(/already has/);
    const c = crawl({}, { images: { total: 0, missingAlt: 0, list: [] } });
    const out = finalizeReport(draft({ criticalIssues: ['Many product images are missing alternative text descriptions across the page'], recommendedFixes: [{ title: 'Add alt text to product images', category: 'content', priority: 'high', description: 'Many product images are missing alternative text descriptions across the page', remediation: 'Add alt text' }] }), c);
    expect(out.criticalIssues).toEqual([]);
    expect(out.recommendedFixes).toEqual([]);
  });
  it('R4-06: report-only CSP is not "missing"', () => {
    const c = crawl({ securityHeaders: { https: true, hsts: true, csp: false, cspReportOnly: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true } as any });
    expect(contradiction('content-security-policy is missing: start with a report-only policy', c)).toMatch(/Report-Only/);
    expect(computeScores(c).breakdown.technical.map((d) => d.reason).join(' ')).toMatch(/report-only/);
  });
  it('R4-07: location-based redirects are not a defect, and hop counts must match', () => {
    const geo = crawl({ redirectChain: ['https://www.site.test/', 'https://geo.site.test/', 'https://geo.site.test/area/x'] });
    expect(contradiction('redirect chain: use a single 301 redirect to the final page', geo)).toMatch(/location or language/);
    const two = crawl({ redirectChain: ['https://a.test/', 'https://b.test/', 'https://c.test/'] });
    expect(contradiction('a three-hop redirect chain slows crawling', two)).toMatch(/not 3/);
    expect(contradiction('a two-hop redirect chain slows crawling', two)).toBeNull();
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [{ title: 'Collapse the redirect chain', category: 'technical', priority: 'high', description: 'a two-hop redirect chain', remediation: 'Use one 301' }] }), two);
    expect(out.recommendedFixes.find((f) => /redirect/i.test(f.title))?.priority).toBe('medium');
  });
  it('R4-08: no FAQPage without visible Q&A, no breadcrumbs on a homepage', () => {
    const c = withFacts({ signals: signals() });
    expect(contradiction('add faqpage schema for the marketing sections', c)).toMatch(/question-and-answer/);
    const withQ = crawl({ facts: { signals: signals() } as any }, { headings: { h1: ['x'], h2: ['How do I reset my password?'], h3: [] } });
    expect(contradiction('add faqpage schema for the questions', withQ)).toBeNull();
    expect(contradiction('add breadcrumblist schema to the home page showing home > en-us', base)).toMatch(/homepage/);
  });
  it('R4-09: no images or a short page are never critical', () => {
    const c = crawl({}, { images: { total: 0, missingAlt: 0, list: [] }, wordCount: 200 });
    const out = finalizeReport(draft({ criticalIssues: ['No images limit visual engagement', 'Word count of 200 is thin'], recommendedFixes: [] }), c);
    expect(out.criticalIssues).toEqual([]);
  });
  it('R3-06: HTTP 999 is not a broken link', () => {
    const c = crawl({ brokenLinks: [{ href: 'https://linkedin.test/x', status: 999, type: 'external' }, { href: 'https://x.test/gone', status: 404, type: 'internal' }] });
    expect(computeScores(c).breakdown.technical.find((d) => /broken/.test(d.reason))?.reason).toMatch(/^1 broken/);
    expect(contradiction('one broken external link returns status 999', c)).toMatch(/anti-bot/);
  });
});

describe('R5-07 / R5-08 wording and padding', () => {
  it('replaces payload identifiers with plain words', () => {
    expect(plainEnglish('robotsTxtAllows is false and sitemapFound: false; missingAltCount is 3; visibleSections.faq')).toBe('the robots.txt rules is false and no sitemap was found; the number of images without an alt attribute is 3; the faq section');
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [{ title: 'Check meta.canonical', category: 'technical', priority: 'low', description: 'structuredData.hasJsonLd looks fine', remediation: 'Review' }] }), crawl());
    expect(JSON.stringify(out.recommendedFixes)).not.toMatch(/meta\.canonical|hasJsonLd/);
  });
  it('drops fixes that say they are not a defect', () => {
    const out = finalizeReport(draft({ criticalIssues: [], recommendedFixes: [{ title: 'Keep the 301', category: 'technical', priority: 'low', description: 'This is not a defect, just worth noting.', remediation: 'No action needed.' }] }), crawl());
    expect(out.recommendedFixes.find((f) => f.title === 'Keep the 301')).toBeUndefined();
  });
});

describe('F-MEASURE fields consumed', () => {
  const rvr = (over: Record<string, unknown> = {}) => ({ rawStatus: 403, rawBytes: 5000, rawWords: 9, rawLinks: 0, rawSchemaTypes: [], renderedWords: 774, renderedLinks: 89, renderedSchemaTypes: [], schemaOnlyAfterJs: [], navButtons: 0, navAnchors: 5, ...over });
  it('a bot-wall or unreliable raw response is not a JavaScript-dependence finding or a score penalty', () => {
    for (const flag of [{ rawChallenge: 'Just a moment' }, { rawFetchUnreliable: 'cut off' }]) {
      const c = withFacts({ rawVsRendered: rvr(flag), signals: signals() });
      expect(computeScores(c).breakdown.aeoGeo.map((d) => d.reason).join(' ')).not.toMatch(/JavaScript/);
      const out = finalizeReport(draft({ criticalIssues: ['Without JavaScript the page has only 9 words'], recommendedFixes: [] }), c);
      expect(out.criticalIssues.join(' ')).not.toMatch(/JavaScript/);
      expect(out.recommendedFixes.map((f) => f.title).join(' ')).not.toMatch(/main content in the HTML/);
      expect(contradiction('server-side render your content: raw html has 9 words', c)).toMatch(/bot wall or unreliable/);
    }
    const ok = withFacts({ rawVsRendered: rvr({ rawStatus: 200 }), signals: signals() });
    expect(computeScores(ok).breakdown.aeoGeo.map((d) => d.reason).join(' ')).toMatch(/JavaScript/);
  });
  it('uses redirectHops and labels page weight honestly', () => {
    expect(contradiction('a two-hop redirect chain', crawl({ redirectChain: ['a', 'b'], redirectHops: 1 }))).toMatch(/measured 1 redirect,/);
    const c = crawl({}, { pageSizeKb: 40, transferKb: 4000 });
    expect(computeScores(c).breakdown.performance.map((d) => d.reason).join(' ')).toMatch(/page transfers 4000 KB/);
    const html = crawl({}, { pageSizeKb: 2000 });
    expect(computeScores(html).breakdown.performance.map((d) => d.reason).join(' ')).toMatch(/HTML document is 2000 KB/);
  });
});
