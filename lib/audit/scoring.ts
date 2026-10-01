import type { CrawlResult, DeepSeekSeoReport, ScoreBreakdown, ScoreDeduction } from '../../src/types';

import { classifyBots } from './botVerdict';

// Scores are computed, not written. Each category starts at 100 and loses points for specific,
// measured findings; every deduction is recorded with its reason so a score can be explained and
// reproduced. (The report used to take integers straight from a language model, which cannot
// measure anything: the same site could score differently on two runs.)

type Scores = DeepSeekSeoReport['score'];

const WEIGHTS = { technical: 0.30, content: 0.25, aeoGeo: 0.25, performance: 0.20 } as const;

/** Statuses that mean "a bot wall answered", not "the link is dead": never scored as broken. */
const UNVERIFIABLE = new Set([401, 403, 429, 999]);
export const verifiedBroken = (crawl: CrawlResult) => (crawl.brokenLinks ?? []).filter((l) => !UNVERIFIABLE.has(l.status));

/**
 * Navigation built from buttons matters only when crawlers really lose links: no anchors at all in
 * the navigation, or the server-sent HTML has clearly fewer links than the rendered page. Language
 * pickers, search and cookie buttons next to a full set of real links are not a defect.
 */
export function navButtonsMatter(rvr: NonNullable<NonNullable<CrawlResult['facts']>['rawVsRendered']>): boolean {
  if (rvr.rawChallenge || rvr.rawFetchUnreliable) return false;
  if (!(rvr.navButtons > rvr.navAnchors && rvr.navButtons >= 3)) return false;
  return rvr.navAnchors === 0 || rvr.renderedLinks < 10 || rvr.rawLinks < rvr.renderedLinks * 0.8;
}

function total(deductions: ScoreDeduction[]): number {
  return Math.max(0, Math.min(100, 100 - deductions.reduce((n, d) => n + d.points, 0)));
}

export function computeScores(crawl: CrawlResult): { score: Scores; breakdown: ScoreBreakdown } {
  const page = crawl.mainPage;
  const facts = crawl.facts;
  const rvr = facts?.rawVsRendered;
  const bots = facts?.botAccess;
  const sec = crawl.securityHeaders;

  const technical: ScoreDeduction[] = [];
  const content: ScoreDeduction[] = [];
  const aeoGeo: ScoreDeduction[] = [];
  const performance: ScoreDeduction[] = [];
  const t = (points: number, reason: string) => technical.push({ points, reason });
  const c = (points: number, reason: string) => content.push({ points, reason });
  const a = (points: number, reason: string) => aeoGeo.push({ points, reason });
  const p = (points: number, reason: string) => performance.push({ points, reason });

  // ---- Technical: can the site be crawled, indexed and trusted? ----
  if (crawl.robotsBlocksAll === true) t(40, 'robots.txt disallows the whole site');
  if (/noindex/i.test(page.meta.robots || '')) t(30, 'the page carries a noindex robots meta tag');
  if (sec && !sec.https) t(20, 'served over plain HTTP');
  if (sec) {
    if (!sec.hsts) t(3, 'no Strict-Transport-Security header');
    if (!sec.csp) {
      // A report-only policy is observed but not enforced: a smaller gap than none at all.
      if (sec.cspReportOnly) t(1, 'Content-Security-Policy is report-only (not enforced)');
      else t(3, 'no Content-Security-Policy header');
    }
    if (!sec.xFrameOptions) t(2, 'no X-Frame-Options / frame-ancestors');
    if (!sec.xContentTypeOptions) t(2, 'no X-Content-Type-Options header');
    if (!sec.referrerPolicy) t(2, 'no Referrer-Policy header');
  }
  // A sitemap request that was refused or failed says nothing about whether one exists.
  if (!crawl.sitemapFound && crawl.sitemapChecked !== false) t(6, 'no sitemap found');
  if (!page.meta.canonical) t(4, 'no canonical URL');
  if (!page.meta.viewport) t(5, 'no viewport meta tag (not mobile-ready)');
  if (!page.meta.title) t(8, 'no <title>');
  if (crawl.redirectChain && crawl.redirectChain.length > 2) t(5, `${crawl.redirectChain.length - 1} redirect hops to reach the page`);
  const broken = verifiedBroken(crawl);
  if (broken.length) t(Math.min(12, broken.length * 3), `${broken.length} broken link(s) in the sampled ${crawl.linksChecked ?? '?'}`);
  if (crawl.duplicateTitles?.length) t(4, `${crawl.duplicateTitles.length} title(s) shared by several crawled pages`);
  if (crawl.duplicateDescriptions?.length) t(3, `${crawl.duplicateDescriptions.length} description(s) shared by several crawled pages`);
  if (page.lang === '') t(2, 'no <html lang>');

  // ---- Content: is there something worth indexing, and is it structured? ----
  const words = page.wordCount ?? rvr?.renderedWords ?? 0;
  if (!page.headings.h1.length) c(20, 'no H1 heading');
  if (!page.meta.description) c(10, 'no meta description');
  if (words < 150) c(30, `only ${words} visible words`);
  else if (words < 300) c(18, `thin content: ${words} visible words`);
  // alt="" is the valid way to mark a decorative image, so only images with NO alt attribute count.
  // Scans stored before the split only have the combined `missingAlt`.
  const noAlt = page.images.noAltAttribute ?? page.images.missingAlt;
  if (page.images.total > 0 && noAlt > 0) {
    c(Math.min(10, Math.round((20 * noAlt) / page.images.total)), `${noAlt} of ${page.images.total} images have no alt attribute`);
  }
  if (!page.headings.h2.length && words > 300) c(6, 'no H2 headings to structure the content');
  if (page.social && !page.social.ogTitle && !page.social.ogDescription && !page.social.ogImage) c(4, 'no Open Graph tags for link previews');

  // ---- AEO/GEO: can search engines and AI assistants find, read and cite it? ----
  if (!page.structuredData.hasJsonLd) a(20, 'no JSON-LD structured data');
  if (!crawl.llmsTxtFound && crawl.llmsChecked !== false) a(8, 'no llms.txt');
  if (bots) {
    // Only GENUINE blocks cost points: refusals that are inconclusive (IP-verified crawlers refusing
    // a spoofed request, a site that refuses every non-browser client) or that match robots.txt's own
    // Disallow rules are not defects.
    const { genuineSearch: blockedSearch, genuineTraining: blockedTraining, conflicts } = classifyBots(bots);
    if (blockedSearch.length) a(Math.min(32, blockedSearch.length * 8), `search/assistant crawlers refused: ${blockedSearch.map((r) => r.name).join(', ')}`);
    if (blockedTraining.length) a(Math.min(4, blockedTraining.length), `AI-training crawlers refused: ${blockedTraining.map((r) => r.name).join(', ')} (may be intentional)`);
    if (conflicts.length) a(3, 'robots.txt welcomes crawlers that the site then refuses');
  }
  // A bot wall or cut-off response is not the site's no-JavaScript page: compare nothing.
  if (rvr && !rvr.rawChallenge && !rvr.rawFetchUnreliable) {
    if (rvr.rawWords < 100 && rvr.renderedWords > 300) a(20, `almost no content without JavaScript (${rvr.rawWords} words raw vs ${rvr.renderedWords} rendered)`);
    else if (rvr.rawWords < 300 && rvr.renderedWords >= 200 && rvr.renderedWords > rvr.rawWords * 2) a(12, `most content needs JavaScript (${rvr.rawWords} words raw vs ${rvr.renderedWords} rendered)`);
    if (rvr.schemaOnlyAfterJs.length) a(4, `schema only exists after JavaScript: ${rvr.schemaOnlyAfterJs.join(', ')}`);
    if (navButtonsMatter(rvr)) a(6, 'navigation uses buttons instead of links, so crawlers cannot follow it');
  }
  if (facts?.schema?.invisible.length) a(8, 'structured data describes content that is not visible on the page');
  if (page.headings.h2.length < 2) a(6, 'fewer than two H2 sections to answer questions under');

  // ---- Performance: lab measurements from the scanning host ----
  if (page.loadTimeMs > 4000) p(35, `load time ${page.loadTimeMs} ms`);
  else if (page.loadTimeMs > 2500) p(22, `load time ${page.loadTimeMs} ms`);
  else if (page.loadTimeMs > 1000) p(10, `load time ${page.loadTimeMs} ms`);
  if (page.ttfbMs !== undefined) {
    if (page.ttfbMs > 1500) p(18, `time to first byte ${page.ttfbMs} ms`);
    else if (page.ttfbMs > 800) p(10, `time to first byte ${page.ttfbMs} ms`);
    else if (page.ttfbMs > 500) p(4, `time to first byte ${page.ttfbMs} ms`);
  }
  const lcp = page.webVitals?.lcpMs;
  if (lcp !== undefined) {
    if (lcp > 4000) p(20, `lab LCP ${Math.round(lcp)} ms`);
    else if (lcp > 2500) p(10, `lab LCP ${Math.round(lcp)} ms`);
  }
  const cls = page.webVitals?.cls;
  if (cls !== undefined) {
    if (cls > 0.25) p(15, `lab CLS ${cls}`);
    else if (cls > 0.1) p(7, `lab CLS ${cls}`);
  }
  // Total transfer when measured; pageSizeKb alone is only the HTML document.
  const weight = page.transferKb ?? page.pageSizeKb;
  const weightLabel = page.transferKb !== undefined ? 'page transfers' : 'HTML document is';
  if (weight > 3000) p(10, `${weightLabel} ${Math.round(weight)} KB`);
  else if (weight > 1500) p(5, `${weightLabel} ${Math.round(weight)} KB`);

  const breakdown: ScoreBreakdown = { technical, content, aeoGeo, performance };
  const tech = total(technical), cont = total(content), aeo = total(aeoGeo), perf = total(performance);
  const overall = Math.round(tech * WEIGHTS.technical + cont * WEIGHTS.content + aeo * WEIGHTS.aeoGeo + perf * WEIGHTS.performance);
  return { score: { overall, technical: tech, content: cont, aeoGeo: aeo, performance: perf }, breakdown };
}

export const SCORE_WEIGHTS = WEIGHTS;
