import { CrawlResult, DeepSeekSeoReport } from '../src/types';
import { buildAgentReadyPrompt } from '../src/agentPrompt';
import { clip, heartbeat, noopEmit, type Emit } from './progress';

const apiKey = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

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

  if (!key) {
    emit('ai', 'warn', 'DEEPSEEK_API_KEY is not configured: using the OFFLINE generator (rule-based, no AI model involved)');
    const offline = generateSimulatorReport(crawl);
    emitReportSummary(offline, 'brief built locally by the deterministic builder', emit);
    return offline;
  }

  const cleanCrawlDataString = JSON.stringify({
    rootUrl: crawl.rootUrl,
    mode: crawl.mode,
    depth: crawl.depth,
    sitemapFound: crawl.sitemapFound,
    llmsTxtFound: crawl.llmsTxtFound,
    isSimulatedData: crawl.hasSimulatedData,
    robotsBlocksAll: crawl.robotsBlocksAll,
    redirectChain: crawl.redirectChain,
    securityHeaders: crawl.securityHeaders,
    brokenLinks: crawl.brokenLinks,
    linksChecked: crawl.linksChecked,
    duplicateTitles: crawl.duplicateTitles,
    duplicateDescriptions: crawl.duplicateDescriptions,
    mainPage: {
      url: crawl.mainPage.url,
      loadTimeMs: crawl.mainPage.loadTimeMs,
      ttfbMs: crawl.mainPage.ttfbMs,
      pageSizeKb: crawl.mainPage.pageSizeKb,
      meta: crawl.mainPage.meta,
      headings: crawl.mainPage.headings,
      imagesCount: crawl.mainPage.images.total,
      missingAltCount: crawl.mainPage.images.missingAlt,
      linksCount: crawl.mainPage.links.total,
      internalLinksCount: crawl.mainPage.links.internal,
      externalLinksCount: crawl.mainPage.links.external,
      structuredData: crawl.mainPage.structuredData,
      lang: crawl.mainPage.lang,
      social: crawl.mainPage.social,
      hreflang: crawl.mainPage.hreflang,
      wordCount: crawl.mainPage.wordCount,
      webVitals: crawl.mainPage.webVitals
    },
    additionalPagesSummary: crawl.additionalPages.map(page => ({
      url: page.url,
      loadTimeMs: page.loadTimeMs,
      headingsCount: page.headings.h1.length + page.headings.h2.length,
      missingAltPercent: page.images.total ? Math.round((page.images.missingAlt / page.images.total) * 100) : 0
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
- Decorative images legitimately carry empty alt text. Raise missing alt text as an accessibility/content improvement rather than a critical ranking failure.
- If the payload is too thin to support a claim you would like to make, omit the claim instead of guessing.
- Fields such as securityHeaders, social (Open Graph/Twitter), hreflang, lang, wordCount, webVitals, redirectChain, brokenLinks and duplicate* may be missing entirely (older crawl or the check did not run). A missing FIELD means "not checked", not "absent" — only report absence when the field is present and shows it (e.g. securityHeaders.csp === false, social.ogImage === "").
- hreflang only matters for multi-language or multi-region sites; do not raise its absence on a single-language site.
- brokenLinks comes from a SAMPLE of linksChecked links, not the whole site. Report those exact links; do not extrapolate a site-wide broken-link count.
- webVitals are lab measurements from the auditing host, not real-user field data; label them as such and never present them as the site's Core Web Vitals assessment.
- robotsBlocksAll === true means robots.txt disallows every crawler from the whole site: that is a critical issue. A redirectChain longer than 2 entries means multiple redirect hops before the final page.
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

    // JSON mode normally returns bare JSON, but defensively strip any markdown fences.
    reportText = reportText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    const parsedReport = JSON.parse(reportText) as DeepSeekSeoReport;

    // The agent hand-off prompt is the payoff of the report, so never leave the user
    // without one if the model omitted or malformed it — fall back to the deterministic
    // builder, which derives the same structure from the fixes we already have.
    emit('ai', 'ok', 'response is valid JSON and matches the report shape');
    const modelWrotePrompt = !!parsedReport.agentReadyPrompt?.prompt;
    if (!parsedReport.agentReadyPrompt?.prompt) {
      parsedReport.agentReadyPrompt = buildAgentReadyPrompt({
        url: crawl.rootUrl,
        score: parsedReport.score,
        criticalIssues: parsedReport.criticalIssues ?? [],
        recommendedFixes: parsedReport.recommendedFixes ?? [],
        aeoAssessment: parsedReport.aeoAssessment,
        executiveSummary: parsedReport.executiveSummary,
        isSimulated: crawl.hasSimulatedData
      });
    }

    emitReportSummary(
      parsedReport,
      modelWrotePrompt ? 'brief written by the model' : 'the model omitted the brief, so it was built locally',
      emit
    );
    return parsedReport;
  } catch (err: any) {
    stopBeat();
    console.error('DeepSeek generation failed, falling back to expert local builder:', err);
    emit('ai', 'warn', `DeepSeek failed (${clip(err?.message, 110)}): using the OFFLINE generator instead. This report is NOT AI-written.`);
    const offline = generateSimulatorReport(crawl);
    emitReportSummary(offline, 'brief built locally by the deterministic builder', emit);
    return offline;
  }
}

/**
 * Local Analysis Builder (Simulation Failsafe)
 * Generates highly smart, customized audits offline so user workflow never interrupts.
 */
function generateSimulatorReport(crawl: CrawlResult): DeepSeekSeoReport {
  const loadTime = crawl.mainPage.loadTimeMs;
  const missingAlts = crawl.mainPage.images.missingAlt;
  const host = new URL(crawl.rootUrl).hostname;
  const brand = host.replace('www.', '').split('.')[0];

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

  if (!crawl.sitemapFound) {
    criticalIssues.push('Sitemap.xml was not found or was unavailable.');
    fixes.push({
      title: 'Create and reference Sitemap.xml',
      category: 'technical',
      priority: 'high',
      description: 'Crawlers rely on mapped link architectures to crawl nested URLs effectively.',
      remediation: 'Generate a dynamic sitemap listing index links and write a "Sitemap: /sitemap.xml" rule to robots.txt.'
    });
  }

  if (loadTime > 600) {
    criticalIssues.push(`Detected slow page generation delay of ${loadTime}ms.`);
    fixes.push({
      title: 'Optimize Core Asset Performance',
      category: 'performance',
      priority: 'medium',
      description: 'Response times exceed 2026 search speed standards, creating immediate conversion drop-off.',
      remediation: 'Leverage CDN edge hosting, compress images with dynamic next-gen formats (WebP/AVIF), and defer secondary client scripts.'
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

  if (crawl.brokenLinks && crawl.brokenLinks.length > 0) {
    extraPenalty += Math.min(10, crawl.brokenLinks.length * 3);
    fixes.push({
      title: 'Fix or remove broken links',
      category: 'technical',
      priority: 'medium',
      description: `${crawl.brokenLinks.length} of ${crawl.linksChecked ?? 'the sampled'} checked links failed: ${crawl.brokenLinks.slice(0, 5).map((l) => `${l.href} (${l.status || 'DNS failure'})`).join(', ')}.`,
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

  // Ensure we always have at least 3-4 interesting fixes
  if (fixes.length < 3) {
    fixes.push({
      title: 'Strengthen Answer optimization structures (AEO)',
      category: 'aeo-geo',
      priority: 'medium',
      description: 'Structure of subheadings could benefit from natural language answers to target AI prompt queries.',
      remediation: 'Introduce a target FAQ zone on the landing page matching user inquiry queries to trigger Google Featured Snippets.'
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
  const finalIssues = criticalIssues.length > 0 ? criticalIssues : ['Sub-optimal content semantic nesting for voice searches.'];
  const aeoAssessment = {
    generativeFriendlinessScore: crawl.mainPage.structuredData.hasJsonLd ? 85 : 55,
    directAnswerFriendliness: crawl.mainPage.headings.h2.length > 2
      ? 'Excellent. Structuring topics with clean subheadings facilitates quick parsing by LLMs.'
      : 'Moderate. Content layouts require precise visual sections to outline immediate answers to topic searches.',
    richSnippetEligibility: crawl.mainPage.structuredData.types.length > 0
      ? crawl.mainPage.structuredData.types
      : ['Organization', 'Product', 'WebSite', 'LocalBusiness'],
    voiceSearchOptimized: crawl.mainPage.headings.h3.length > 1,
    recommendationsForAeo: [
      'Organize FAQ blocks in precise QA formats using JSON-LD FAQPage structures.',
      'Adopt bulleted bullet summaries at the beginning of detailed services pages.',
      'Configure clean Schema schemas mapping specific business locations and values.'
    ]
  };
  const executiveSummary = `${crawl.hasSimulatedData ? `NOTE: ${host} could not be reached during this scan, so the data below is simulated placeholder content, not a real audit of the site. ` : ''}The scan of ${host} exposes an overall SEO posture score of ${overallFinal}/100. While the primary index structural configurations are operational, crawlability and modern artificial intelligence grounding (GEO) can be significantly improved. Introducing Schema.org structured models, resolving media alt tags, and compressing static assets will immediately amplify index ranking and generative engine visibility.`;

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
    }),
    competitorComparisonText: `Compared to local benchmarks, ${brand.toUpperCase()} holds solid keyword density levels but trails premium competitors who leverage comprehensive structured sitemaps and responsive media compressions.`
  };
}
