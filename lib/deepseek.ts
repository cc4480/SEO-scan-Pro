import { CrawlResult, DeepSeekSeoReport } from '../src/types';
import { buildAgentReadyPrompt } from '../src/agentPrompt';
import { clip, heartbeat, noopEmit, type Emit } from './progress';
import { deepseekModelConfig } from './deepseekModel';
import { finalizeReport } from './audit/finalize';
import { botVerdict } from './audit/botVerdict';
import { verifiedBroken } from './audit/scoring';

const apiKey = process.env.DEEPSEEK_API_KEY;
const { baseUrl: DEEPSEEK_BASE_URL, model: DEEPSEEK_MODEL, extra: DEEPSEEK_EXTRA } = deepseekModelConfig();

// Lazy key check so the app server never crashes on launch if the user hasn't set up credentials yet
function getApiKey(): string | null {
  if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY' || apiKey === 'MY_DEEPSEEK_API_KEY') {
    console.warn('DEEPSEEK_API_KEY not found in environment. Simulated analysis mode enabled.');
    return null;
  }
  return apiKey;
}

// Logs what the report contains and where the agent brief came from. Only real values: the scores
// are the ones being returned, and `promptSource` states who actually wrote the brief.
function emitReportSummary(report: DeepSeekSeoReport, promptSource: string, emit: Emit): void {
  const sc = report.score;
  emit('ai', 'ok', `scores: overall ${sc.overall} · technical ${sc.technical} · content ${sc.content} · AEO/GEO ${sc.aeoGeo} · performance ${sc.performance}`);
  const crit = report.criticalIssues?.length ?? 0;
  emit('ai', crit ? 'warn' : 'ok', `${crit} critical issue(s), ${report.recommendedFixes?.length ?? 0} recommended fix(es)`);
  emit('ai', 'done', `overall ${sc.overall}/100`);

  emit('prompt', 'start', 'assembling the agent hand-off brief');
  const brief = report.agentReadyPrompt;
  emit('prompt', 'ok', `${promptSource} (${brief?.prompt?.length ?? 0} chars, ${brief?.checklist?.length ?? 0} checklist item(s))`);
  emit('prompt', 'done', 'brief ready');
}

export async function generateSeoReport(crawl: CrawlResult, emit: Emit = noopEmit): Promise<DeepSeekSeoReport> {
  emit('ai', 'start', 'preparing the structured crawl payload');
  const key = getApiKey();

  // Nothing real was read (unreachable, or a bot-challenge page): the honest report is built locally
  // and the model is not asked to write findings about placeholder data.
  if (crawl.hasSimulatedData || crawl.pageKind === 'challenge') {
    emit('ai', 'warn', 'the real page could not be read: writing an honest "could not audit" report, no AI findings');
    const honest = finalizeReport(generateSimulatorReport(crawl), crawl);
    emitReportSummary(honest, 'hand-off brief built locally (no real page was audited)', emit);
    return honest;
  }

  if (!key) {
    emit('ai', 'warn', 'DEEPSEEK_API_KEY is not configured: using the OFFLINE generator (rule-based, no AI model involved)');
    const offline = finalizeReport(generateSimulatorReport(crawl), crawl);
    emitReportSummary(offline, 'brief built locally by the deterministic builder', emit);
    return offline;
  }

  const cleanCrawlDataString = JSON.stringify({
    rootUrl: crawl.rootUrl,
    mode: crawl.mode,
    depth: crawl.depth,
    // "unreadable" = the request was refused or failed, which says nothing about whether the file exists.
    sitemapFound: crawl.sitemapChecked === false ? 'unknown (could not be read)' : crawl.sitemapFound,
    llmsTxtFound: crawl.llmsChecked === false ? 'unknown (could not be read)' : crawl.llmsTxtFound,
    robotsTxtReadable: crawl.robotsReadable,
    pageKind: crawl.pageKind,
    challengeReason: crawl.challengeReason,
    isSimulatedData: crawl.hasSimulatedData,
    robotsBlocksAll: crawl.robotsBlocksAll,
    redirectChain: crawl.redirectChain,
    redirectHops: crawl.redirectHops ?? (crawl.redirectChain ? crawl.redirectChain.length - 1 : undefined),
    securityHeaders: crawl.securityHeaders,
    brokenLinks: verifiedBroken(crawl),
    linksChecked: crawl.linksChecked,
    duplicateTitles: crawl.duplicateTitles,
    duplicateDescriptions: crawl.duplicateDescriptions,
    mainPage: {
      url: crawl.mainPage.url,
      loadTimeMs: crawl.mainPage.loadTimeMs,
      ttfbMs: crawl.mainPage.ttfbMs,
      // pageSizeKb is the HTML document only; transferKb / requestCount (when present) are the whole page.
      htmlSizeKb: crawl.mainPage.pageSizeKb,
      totalTransferKb: crawl.mainPage.transferKb,
      requestCount: crawl.mainPage.requestCount,
      meta: crawl.mainPage.meta,
      headings: crawl.mainPage.headings,
      imagesCount: crawl.mainPage.images.total,
      // Two different things: no alt attribute at all (a defect) vs alt="" (decorative, valid).
      // Only these files exist as far as you know; never name an image (logo, hero, icon) that is not listed here.
      imageSamples: crawl.mainPage.images.list.slice(0, 10).map(i => ({ file: String(i.src || '').split('?')[0].split('/').pop(), alt: i.alt, hasAltAttribute: i.hasAlt })),
      imagesMissingAltAttribute: crawl.mainPage.images.noAltAttribute ?? crawl.mainPage.images.missingAlt,
      imagesWithEmptyAltDecorativeValid: crawl.mainPage.images.emptyAlt,
      linksCount: crawl.mainPage.links.total,
      internalLinksCount: crawl.mainPage.links.internal,
      externalLinksCount: crawl.mainPage.links.external,
      structuredData: crawl.mainPage.structuredData,
      lang: crawl.mainPage.lang,
      social: crawl.mainPage.social,
      hreflangCount: crawl.mainPage.hreflangTotal ?? crawl.mainPage.hreflang?.length,
      hreflang: crawl.mainPage.hreflang?.slice(0, 20),
      wordCount: crawl.mainPage.wordCount,
      webVitals: crawl.mainPage.webVitals
    },
    // Measured evidence (lib/audit): what the site really contains and allows. Treat as ground truth.
    measured: crawl.facts ? {
      crawlerAccess: crawl.facts.botAccess?.results.map(r => ({ crawler: r.name, role: r.role, httpStatus: r.status, blocked: r.blocked, refusalVerdict: botVerdict(r, crawl.facts!.botAccess), robotsTxtAllows: r.robotsAllows })),
      siteRefusesAllNonBrowserClients: crawl.facts.botAccess?.baselineRefused,
      openingText: crawl.facts.signals?.openingText,
      customerStoriesOrCaseStudiesOnPage: crawl.facts.signals?.customerStories,
      languageVersionLinks: crawl.facts.signals?.localeLinks,
      robotsTxtContentSignal: crawl.facts.signals?.contentSignal,
      // When rawChallenge / rawFetchUnreliable is set, the no-JavaScript figures describe a bot wall or a broken response, not the site.
      rawHtmlVsRendered: crawl.facts.rawVsRendered,
      structuredDataEntities: crawl.facts.schema?.entities.map(e => ({ type: e.type, properties: e.props, offers: e.prices, softwareVersion: e.version, totalTime: e.totalTime, hasAggregateRating: e.hasRating, hasReview: e.hasReview })),
      structuredDataNotVisibleOnPage: crawl.facts.schema?.invisible,
      visibleSections: crawl.facts.signals?.sections,
      pricesVisibleOnPage: crawl.facts.signals?.prices,
      genuineReviewsVisible: crawl.facts.signals?.hasVisibleReviews,
      multiLanguage: crawl.facts.signals?.multiLanguage
    } : undefined,
    imagesOnPage: crawl.mainPage.images.total,
    additionalPagesSummary: crawl.additionalPages.map(page => ({
      url: page.url,
      loadTimeMs: page.loadTimeMs,
      headingsCount: page.headings.h1.length + page.headings.h2.length,
      missingAltAttributePercent: page.images.total ? Math.round(((page.images.noAltAttribute ?? page.images.missingAlt) / page.images.total) * 100) : 0
    }))
  });

  const systemInstruction = `You are DeepSeek V4 SEO Audit Engine. You analyze crawled web data and supply professional-grade, actionable SEO & AEO checklists in clear JSON formats. Beyond the audit itself you also write the "agentReadyPrompt": a complete, copy-pasteable instruction block the user can hand to an AI coding agent to implement every recommended fix in their own codebase. You always respond with a single valid JSON object and nothing else.`;

  const prompt = `Perform an enterprise-grade SEO, AEO, and GEO technical audit of the website crawled details.
Represent your narrative in the voice of DeepSeek V4 Core SEO Intelligence - precise, evidence-led, diagnostic, and highly business-actionable. Be rigorous, not alarmist: a false positive is worse than a missed nit, because the user acts on what you report.

Website Scan Payload:
${cleanCrawlDataString}

Produce a completely populated audit. Keep description text practical. Detail the exact corrective steps to boost visibility in Google, Gemini, ChatGPT Search, Perplexity, and traditional search engines. Always calculate accurate performance scores based on the actual stats (e.g. low load times increase performance/aeo scores, missing alt tags reduce technical score).

EVIDENCE RULES — the payload above is your ONLY source of truth. You have no other knowledge of this site:
- Every entry in criticalIssues and recommendedFixes MUST be directly supported by a value in the payload. Never assert that something is absent unless the payload actually shows it absent. In particular, do not mention llms.txt unless llmsTxtFound is false, and do not claim schema is missing unless structuredData.types is empty.
- structuredData.types already contains every @type found anywhere in the JSON-LD, including inside "@graph" wrappers and nested entities. If a type is listed there, the site HAS that structured data — reporting it as missing is a factual error.
- loadTimeMs and ttfbMs were measured from the auditing host, which may sit far from the target's real users or on a slow link. If ttfbMs accounts for most of loadTimeMs, the measurement is network-bound: say that plainly, and do not attribute it to the site's own front-end performance, Core Web Vitals, or conversion.
- Multiple <h1> elements are not a ranking problem in modern search. Do not raise them as a critical issue.
- Decorative images legitimately carry empty alt text (alt=""), which is VALID. imagesMissingAltAttribute counts images with no alt attribute at all (the only alt defect); imagesWithEmptyAltDecorativeValid counts alt="" images and is never a defect. Never add the two together, and never say images "have no alt attribute" using anything but imagesMissingAltAttribute. Even then it is an accessibility/content improvement, not a critical ranking failure.
- If the payload is too thin to support a claim you would like to make, omit the claim instead of guessing.
- Fields such as securityHeaders, social (Open Graph/Twitter), hreflang, lang, wordCount, webVitals, redirectChain, brokenLinks and duplicate* may be missing entirely (older crawl or the check did not run). A missing FIELD means "not checked", not "absent" — only report absence when the field is present and shows it (e.g. securityHeaders.csp === false, social.ogImage === "").
- hreflang only matters for multi-language or multi-region sites; do not raise its absence on a single-language site.
- brokenLinks comes from a SAMPLE of linksChecked links, not the whole site. Report those exact links; do not extrapolate a site-wide broken-link count.
- webVitals are lab measurements from the auditing host, not real-user field data; label them as such and never present them as the site's Core Web Vitals assessment.
- robotsBlocksAll === true means robots.txt disallows every crawler from the whole site: that is a critical issue. A redirectChain longer than 2 entries means multiple redirect hops before the final page.
- If rawHtmlVsRendered.rawChallenge or rawFetchUnreliable is set, do not state any raw (no-JavaScript) word, link or schema figure and do not raise a JavaScript-dependence finding. htmlSizeKb is the size of the HTML document only, not the page weight; use totalTransferKb for page weight and quote hreflangCount, not the length of the hreflang sample.
- The "measured" object is ground truth from direct requests and parsing. Before recommending anything, check it against "measured" and the rest of the payload, and OMIT the recommendation if the site already does it. In particular: structuredDataEntities lists the properties each schema entity really has (e.g. do not ask for applicationCategory, operatingSystem, offers or totalTime when they are listed); visibleSections says which sections the page already has (never ask to "add" a pricing, FAQ, how-it-works or feature section that visibleSections shows as present); imagesOnPage of 0 means there is no alt text to fix.
- NEVER recommend aggregateRating, Review or star-rating markup unless genuineReviewsVisible is true. NEVER put an example price in a recommendation: the only prices you may mention are in pricesVisibleOnPage or structuredDataEntities.offers, and otherwise say "use the price shown on the page".
- FAQ rich results no longer appear in Google Search and HowTo rich results were deprecated earlier. FAQPage and HowTo markup is still valid and can help machines, but never tell the reader to validate it in Google's Rich Results Test or to expect a rich result.
- rawHtmlVsRendered compares what a plain request returns with what a browser renders. If most content or any schema type exists only after JavaScript, say so, and say it is "commonly reported" (not tested per crawler) that many AI retrieval crawlers do not run JavaScript.
- crawlerAccess is a real test per crawler. A blocked training crawler (GPTBot, ClaudeBot, CCBot, Bytespider) is the site owner's policy decision, not an error, unless robotsTxtAllows says otherwise; blocked search or assistant crawlers are a real problem. Only count real <a href> links as internal links; navigation made of buttons is invisible to crawlers.
- Never list a recommendation for something that is already correct ("keep the FAQ markup aligned", "consider keeping llms.txt tidy", "check the content types", "confirm"): a fix must name a concrete change the site does not already have, and must not rest on a guess about the page. Never say a page lacks a definition, an opening summary or a relationship statement without checking openingText and the visible headings first.
- Scores you write are discarded and recomputed from measurements; do not defend or explain numbers, concentrate on accurate findings.
- Each crawlerAccess entry has a refusalVerdict. "genuine" = refused although robots.txt allows or is silent: a real problem. "policy" = refused AND robots.txt explicitly disallows it (robotsTxtAllows false): what robots.txt states, not an error; never call it a problem, an ambiguity or a lost opportunity, and never claim the owner chose it deliberately: say robots.txt asks these crawlers to stay out and, in one clause, that if this was not intended (CDNs and hosts such as Cloudflare can add such rules by default) the rules can be removed. "inconclusive" = refused but not provable as a block (IP-verified crawlers such as Googlebot, Bingbot, Applebot refuse imitations on purpose; siteRefusesAllNonBrowserClients means every non-browser request was refused): say it cannot be confirmed and that Search Console, Bing Webmaster Tools or server logs would settle it; never call it blocked. Never write that robots.txt "does not explicitly allow or disallow" a crawler whose robotsTxtAllows is false.
- sitemapFound, llmsTxtFound or robotsTxtReadable showing "unknown (could not be read)" / false means the request was refused or failed: say nothing about whether that file exists.
- measured.openingText is the first ~120 words of the page's main visible text. Any claim about the presence or absence of a direct answer, definition or summary near the top MUST be based on openingText; if openingText is missing, omit such claims.
- If pageKind is "challenge", the crawled page was a bot-challenge interstitial, not the site: report nothing about its title, description, headings or content.
- Mark as critical ONLY: robots.txt blocking everything, noindex, unreachable page, missing HTTPS, search/assistant crawlers with refusalVerdict "genuine", a severe JavaScript gap, or a missing title / H1. Everything else is a recommended fix, however useful.
- Write for a site owner, not a developer: never quote payload field names or code identifiers (robotsTxtAllows, sitemapFound, missingAltCount, visibleSections.faq and the like); say it in plain words.
- robotsTxtAllows false means robots.txt EXPLICITLY DISALLOWS that crawler. Never advise allowing it, never call the policy unclear, and never write that robots.txt allows it. If robotsTxtReadable is false, say nothing about what robots.txt allows or disallows.
- Name an image, logo or icon only if it appears in imageSamples. Do not guess what an image shows.
- structuredData.types and structuredDataEntities use schema.org names; a subtype counts as its parent (Corporation, LocalBusiness, NGO, OnlineStore are all Organization). Never say Organization markup is missing when one of them is listed.
- customerStoriesOrCaseStudiesOnPage true means the page has customer stories: do not say testimonials or case studies are missing. visibleSections.reviews only concerns ratings/review markup.
- Navigation "buttons" (menus toggles, search, language pickers, cookie banners) are normal. Raise navigation only when the raw HTML really lacks the links (rawHtmlVsRendered.rawLinks far below renderedLinks).
- Retired or unsupported Google features must not be offered as benefits: no FAQ or HowTo rich results, no "sitelinks search box". Recommend SearchAction only if a real search URL appears in the payload; FAQPage only if the page visibly has questions with answers; BreadcrumbList never for a homepage.
- llms.txt is optional and not confirmed to be read by any major engine or assistant: at most a low-priority suggestion, with no promise of better retrieval or citation.
- Redirects: redirectChain lists URLs, so the number of hops is its length minus one. A temporary redirect based on the visitor's location or language is by design, not a defect.
- A response of HTTP 999, 401, 403 or 429 to a link check is a bot wall, not a broken link. securityHeaders.cspReportOnly true means a Content-Security-Policy is already being observed; do not say CSP is missing.
- Absence of images, or a short page, on a text-first site is not critical. If a suggestion would say "this is not a defect" or "no action needed", leave it out.
- If languageVersionLinks is present but hreflang is empty, the site offers language versions and does not declare them: that is a real gap. If robotsTxtContentSignal.aiTrain is false the site opts out of AI training; never praise training access.
- Judge the sample for what it is: a single-page crawl plus at most a few subpages. Do not generalise a page-level nit into a site-wide verdict.

IMPORTANT: If "isSimulatedData" is true, the site could not actually be reached or crawled (offline, blocked, or timed out), and the payload above is placeholder data, NOT a real crawl of the site. In that case you MUST open the executiveSummary with a clear statement that live data could not be retrieved and these findings are illustrative only, not an actual audit of the target site.

Respond with a single valid JSON object (no markdown fences, no commentary) matching EXACTLY this shape:
{
  "score": { "overall": <integer 0-100>, "technical": <integer 0-100>, "content": <integer 0-100>, "aeoGeo": <integer 0-100>, "performance": <integer 0-100> },
  "executiveSummary": "<string>",
  "criticalIssues": ["<string>", "..."],
  "recommendedFixes": [
    { "title": "<string>", "category": "technical|content|aeo-geo|performance", "priority": "high|medium|low", "description": "<string>", "remediation": "<string>" }
  ],
  "aeoAssessment": {
    "generativeFriendlinessScore": <integer 0-100>,
    "directAnswerFriendliness": "<string>",
    "richSnippetEligibility": ["<string>", "..."],
    "voiceSearchOptimized": <true|false>,
    "recommendationsForAeo": ["<string>", "..."]
  },
  "agentReadyPrompt": {
    "title": "<short imperative title for the fix-it task>",
    "prompt": "<A COMPLETE, copy-pasteable prompt the user can hand to an AI coding agent (Claude Code, Cursor, Copilot) to implement these fixes in their own codebase. Plain text, markdown-style headings, numbered tasks. It MUST: name the audited site; state the overall and per-category scores; list the critical issues; then for EVERY recommended fix give its priority and category, describe the problem on the deployed site, and specify the concrete change to make; and finish with implementation rules plus a definition-of-done checklist.>",
    "checklist": ["<one concrete, verifiable task per fix>", "..."]
  },
  "competitorComparisonText": "<string>"
}`;

  let stopBeat: () => void = () => {};
  try {
    emit('ai', 'info', `sending ${Math.round(cleanCrawlDataString.length / 102.4) / 10}KB crawl payload to ${DEEPSEEK_MODEL}`);
    const askedAt = Date.now();
    stopBeat = heartbeat(emit, 'ai', 'still waiting for DeepSeek to finish writing the report', 5000);
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        ...DEEPSEEK_EXTRA,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API returned ${response.status}: ${errorText}`);
    }

    emit('ai', 'info', `DeepSeek accepted the request (HTTP ${response.status}) after ${((Date.now() - askedAt) / 1000).toFixed(1)}s; the report is generated before it is sent, so the wait continues`);
    const data: any = await response.json();
    stopBeat();
    emit('ai', 'ok', `full report received after ${((Date.now() - askedAt) / 1000).toFixed(1)}s`);
    let reportText: string = data?.choices?.[0]?.message?.content || '';

    // JSON mode normally returns bare JSON, but the model sometimes adds fences or trailing prose
    // after a perfectly good object; take the first complete object rather than failing the report.
    const draftReport = parseModelJson(reportText) as DeepSeekSeoReport;

    // The agent hand-off prompt is the payoff of the report, so never leave the user
    // without one if the model omitted or malformed it — fall back to the deterministic
    // builder, which derives the same structure from the fixes we already have.
    emit('ai', 'ok', 'response is valid JSON and matches the report shape');
    // Check the written report against what was measured: drop what the evidence contradicts, add
    // what it proves, compute the scores, and rebuild the hand-off prompt from the result.
    const parsedReport = finalizeReport(draftReport, crawl);
    for (const r of parsedReport.qa?.removed ?? []) emit('ai', 'warn', `removed an unsupported suggestion "${clip(r.title, 60)}": ${clip(r.reason, 100)}`);
    for (const a of parsedReport.qa?.added ?? []) emit('ai', 'info', `added a measured finding: ${a}`);
    if (parsedReport.scoreMethod === 'measured') emit('ai', 'ok', 'scores computed from the measured checks (no model-written numbers are used)');
    const modelWrotePrompt = false;

    emitReportSummary(
      parsedReport,
      'hand-off brief rebuilt from the checked report',
      emit
    );
    return parsedReport;
  } catch (err: any) {
    stopBeat();
    console.error('DeepSeek generation failed, falling back to expert local builder:', err);
    emit('ai', 'warn', `DeepSeek failed (${clip(err?.message, 110)}): using the OFFLINE generator instead. This report is NOT AI-written.`);
    // Even the fallback is fact-checked, so it cannot assert what the measurements contradict.
    let offline = generateSimulatorReport(crawl);
    try { offline = finalizeReport(offline, crawl); } catch (e: any) { emit('ai', 'warn', `fact-check of the offline report failed (${clip(e?.message, 80)})`); }
    emitReportSummary(offline, 'brief built locally by the deterministic builder', emit);
    return offline;
  }
}

/** Removes markdown fences. */
function unfence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

/**
 * The first balanced top-level JSON object in `text`, as a string (string-aware: braces and quotes
 * inside string values do not count), or null when there is none.
 */
export function firstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/** Parses the model's reply: whole text first, then the first balanced object inside it. Throws when neither parses. */
export function parseModelJson(raw: string): unknown {
  const text = unfence(raw);
  try { return JSON.parse(text); } catch (whole) {
    const obj = firstJsonObject(text);
    if (!obj) throw whole;
    return JSON.parse(obj);
  }
}

/**
 * Local Analysis Builder (Simulation Failsafe)
 * Generates highly smart, customized audits offline so user workflow never interrupts.
 */
function generateSimulatorReport(crawl: CrawlResult): DeepSeekSeoReport {
  const loadTime = crawl.mainPage.loadTimeMs;
  const missingAlts = crawl.mainPage.images.noAltAttribute ?? crawl.mainPage.images.missingAlt;
  const host = new URL(crawl.rootUrl).hostname;

  // Dynamic calculations
  // extraPenalty is declared below with the newer checks; the technical score is finalised after them.
  const baseTechScore = Math.max(50, 95 - (crawl.sitemapFound ? 0 : 20) - (crawl.additionalPages.length === 0 && crawl.mode === 'FULL_SITE' ? 15 : 0));
  const performanceScore = Math.max(40, Math.min(99, Math.round(100 - (loadTime / 30))));
  const contentScore = Math.max(30, 95 - (missingAlts * 4) - (crawl.mainPage.headings.h1.length === 0 ? 30 : 0) - (crawl.mainPage.meta.description ? 0 : 20));
  const aeoScore = Math.max(45, Math.min(98, 70 + (crawl.mainPage.structuredData.hasJsonLd ? 15 : 0) + (crawl.mainPage.headings.h2.length > 2 ? 10 : 0)));
  const overallScore = Math.round((baseTechScore + performanceScore + contentScore + aeoScore) / 4);

  const criticalIssues: string[] = [];
  const fixes: any[] = [];

  if (crawl.mainPage.headings.h1.length === 0) {
    criticalIssues.push('Missing main heading (H1) on target landing page.');
    fixes.push({
      title: 'Implement single distinct H1 Tag',
      category: 'content',
      priority: 'high',
      description: 'H1 element is completely absent. Search bots utilize the H1 tag to establish the structural focus of your page.',
      remediation: 'Structure the top section of the index template to wrap the core value proposition in a single, descriptive <h1> element containing primary target keywords.'
    });
  }

  if (missingAlts > 0) {
    criticalIssues.push(`Found ${missingAlts} images missing alt-text descriptions.`);
    fixes.push({
      title: 'Repair Alt Attributes for Images',
      category: 'content',
      priority: 'medium',
      description: 'Missing alternative texts negatively affect and degrade visual accessibility and Google Image searches.',
      remediation: 'Audit image templates and populate missing [alt] tag values with contextual keywords describing the asset.'
    });
  }

  if (!crawl.sitemapFound && crawl.sitemapChecked !== false) {
    criticalIssues.push('No sitemap was found.');
    fixes.push({
      title: 'Create and reference Sitemap.xml',
      category: 'technical',
      priority: 'low',
      description: 'Crawlers rely on mapped link architectures to crawl nested URLs effectively.',
      remediation: 'Generate a dynamic sitemap listing index links and write a "Sitemap: /sitemap.xml" rule to robots.txt.'
    });
  }

  // Speed is judged on the measured server response and largest paint, not on total load time.
  const ttfb = crawl.mainPage.ttfbMs;
  const lcp = crawl.mainPage.webVitals?.lcpMs;
  if ((ttfb !== undefined && ttfb > 800) || (lcp !== undefined && lcp > 2500)) {
    const parts = [ttfb !== undefined && ttfb > 800 && 'time to first byte ' + ttfb + ' ms', lcp !== undefined && lcp > 2500 && 'largest contentful paint ' + Math.round(lcp) + ' ms'].filter(Boolean);
    fixes.push({
      title: 'Improve server response time and largest contentful paint',
      category: 'performance',
      priority: 'medium',
      description: 'Measured from the scanning host (part of this may be network distance): ' + parts.join(', ') + '. Google treats an LCP of 2500 ms or less as good.',
      remediation: 'Cache the page at a CDN edge, reduce server work before the first byte, and preload the largest above-the-fold image or text block.'
    });
  }

  // ---- Checks added later. Each fires only on evidence actually present in the crawl; a field that
  // is missing (older scan, check did not run) is "not checked", never "failed".
  const page = crawl.mainPage;
  let extraPenalty = 0;

  if (crawl.robotsBlocksAll === true) {
    extraPenalty += 30;
    criticalIssues.push('robots.txt disallows the entire site (User-agent: * / Disallow: /).');
    fixes.push({
      title: 'Remove the site-wide Disallow from robots.txt',
      category: 'technical',
      priority: 'high',
      description: 'robots.txt tells every crawler to stay away from all URLs, so nothing can be indexed.',
      remediation: 'Delete the "Disallow: /" rule for "User-agent: *" (or scope it to the paths that are genuinely private) and redeploy robots.txt.'
    });
  }

  const sec = crawl.securityHeaders;
  if (sec) {
    const missing = [
      !sec.https && 'HTTPS',
      !sec.hsts && 'Strict-Transport-Security',
      !sec.csp && 'Content-Security-Policy',
      !sec.xContentTypeOptions && 'X-Content-Type-Options',
      !sec.xFrameOptions && 'X-Frame-Options / frame-ancestors',
      !sec.referrerPolicy && 'Referrer-Policy'
    ].filter(Boolean) as string[];
    if (!sec.https) {
      extraPenalty += 15;
      criticalIssues.push('The page was served over plain HTTP, not HTTPS.');
    }
    if (missing.length > 0) {
      extraPenalty += Math.min(10, missing.length * 2);
      fixes.push({
        title: 'Add missing security headers',
        category: 'technical',
        priority: sec.https ? 'low' : 'high',
        description: `The response is missing: ${missing.join(', ')}. Browsers and search engines treat HTTPS and hardened headers as trust signals.`,
        remediation: 'Serve HTTPS with a redirect from HTTP, then add the listed headers at the CDN, reverse proxy or application layer.'
      });
    }
  }

  if (crawl.redirectChain && crawl.redirectChain.length > 2) {
    extraPenalty += 5;
    fixes.push({
      title: 'Collapse the redirect chain',
      category: 'technical',
      priority: 'medium',
      description: `Reaching the page takes ${crawl.redirectChain.length - 1} redirects (${crawl.redirectChain.join(' -> ')}).`,
      remediation: 'Point the original URL straight at the final destination with a single 301.'
    });
  }

  if (verifiedBroken(crawl).length > 0) {
    extraPenalty += Math.min(10, verifiedBroken(crawl).length * 3);
    fixes.push({
      title: 'Fix or remove broken links',
      category: 'technical',
      priority: 'medium',
      description: `${verifiedBroken(crawl).length} of ${crawl.linksChecked ?? 'the sampled'} checked links failed: ${verifiedBroken(crawl).slice(0, 5).map((l) => `${l.href} (${l.status || 'DNS failure'})`).join(', ')}.`,
      remediation: 'Update each link to a working URL, redirect the old URL, or remove the link.'
    });
  }

  const dupTitles = crawl.duplicateTitles ?? [];
  if (dupTitles.length > 0) {
    fixes.push({
      title: 'Give every page a unique title',
      category: 'content',
      priority: 'medium',
      description: `${dupTitles.length} title(s) are reused across crawled pages, e.g. "${dupTitles[0].value}" on ${dupTitles[0].urls.join(', ')}.`,
      remediation: 'Write a distinct, descriptive <title> per page that leads with that page\'s own topic.'
    });
  }

  const social = page.social;
  if (social && (!social.ogTitle || !social.ogImage)) {
    fixes.push({
      title: 'Add Open Graph / Twitter Card tags',
      category: 'content',
      priority: 'low',
      description: `Missing: ${[!social.ogTitle && 'og:title', !social.ogDescription && 'og:description', !social.ogImage && 'og:image', !social.twitterCard && 'twitter:card'].filter(Boolean).join(', ')}. Shared links and some AI summarisers rely on them for the title and preview image.`,
      remediation: 'Add og:title, og:description, og:image (1200x630) and twitter:card to the page <head>.'
    });
  }

  if (page.lang !== undefined && !page.lang) {
    fixes.push({
      title: 'Declare the page language',
      category: 'technical',
      priority: 'low',
      description: 'The <html> element has no lang attribute, which weakens language targeting and screen-reader pronunciation.',
      remediation: 'Set <html lang="en"> (or the correct BCP 47 code).'
    });
  }

  if (typeof page.wordCount === 'number' && page.wordCount > 0 && page.wordCount < 300) {
    fixes.push({
      title: 'Expand thin page content',
      category: 'content',
      priority: 'medium',
      description: `Only ${page.wordCount} visible words were found. Pages this short rarely satisfy search intent or give AI answer engines enough to quote.`,
      remediation: 'Add substantive, question-answering copy (aim for 300+ words on pages meant to rank).'
    });
  }

  const vit = page.webVitals;
  if (vit && ((vit.lcpMs ?? 0) > 2500 || (vit.cls ?? 0) > 0.1)) {
    fixes.push({
      title: 'Improve lab Core Web Vitals',
      category: 'performance',
      priority: 'medium',
      description: `Lab-measured from the scanning host (not real-user data): ${vit.lcpMs !== undefined ? `LCP ${vit.lcpMs}ms` : ''}${vit.lcpMs !== undefined && vit.cls !== undefined ? ', ' : ''}${vit.cls !== undefined ? `CLS ${vit.cls}` : ''}. Good thresholds are LCP <= 2500ms and CLS <= 0.1.`,
      remediation: 'Preload the hero image/LCP resource, set explicit width/height on media, and avoid injecting content above existing content after load.'
    });
  }

  // Newer checks can push technical below the old floor of 50: a site that blocks all crawlers
  // really is that bad, and a floor would hide it.
  const techScore = Math.max(10, baseTechScore - extraPenalty);
  const overallFinal = Math.round((techScore + performanceScore + contentScore + aeoScore) / 4);
  const finalScore = {
    overall: overallFinal,
    technical: techScore,
    content: contentScore,
    aeoGeo: aeoScore,
    performance: performanceScore
  };
  const finalIssues = criticalIssues;
  // The rule-based fallback measures; it does not judge writing quality, so it makes no claim about it.
  const aeoAssessment = {
    generativeFriendlinessScore: finalScore.aeoGeo,
    directAnswerFriendliness: 'Not assessed: this report was produced by the rule-based fallback, which does not evaluate how directly the page answers questions.',
    richSnippetEligibility: [] as string[],
    voiceSearchOptimized: false,
    recommendationsForAeo: [] as string[]
  };
  const executiveSummary = 'This report comes from the rule-based fallback (no AI model wrote it), so it lists only what was measured: ' + (finalIssues.length + fixes.length === 0 ? 'no problems were measured in the checks that ran.' : finalIssues.length + ' priority issue(s) and ' + fixes.length + ' recommendation(s), each tied to a measurement.') + ' Scores are computed from the same measurements.';

  return {
    score: finalScore,
    executiveSummary,
    criticalIssues: finalIssues,
    recommendedFixes: fixes,
    aeoAssessment,
    // Even the offline fallback still hands the user a usable agent prompt.
    agentReadyPrompt: buildAgentReadyPrompt({
      url: crawl.rootUrl,
      score: finalScore,
      criticalIssues: finalIssues,
      recommendedFixes: fixes,
      aeoAssessment,
      executiveSummary,
      isSimulated: crawl.hasSimulatedData
    })
  };
}
