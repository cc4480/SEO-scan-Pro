import type { CrawlResult, DeepSeekSeoReport } from '../../src/types';
import { buildAgentReadyPrompt } from '../../src/agentPrompt';
import { computeScores } from './scoring';
import { contradiction } from './contradiction';
import { classifyBots } from './botVerdict';
import { navButtonsMatter } from './scoring';

export { contradiction };

type Fix = DeepSeekSeoReport['recommendedFixes'][number];

// The model writes the report from a summary of the crawl and cannot look at the site, so it
// sometimes recommends things the site already has, invents values, or repeats advice that is out
// of date. This pass checks every written suggestion against what was actually measured, removes
// the ones the evidence contradicts (recording why), and adds the findings that need no judgement.
// Scores are computed from the same evidence rather than taken from the model.

const textOf = (f: { title: string; description?: string; remediation?: string }) =>
  `${f.title} ${f.description ?? ''} ${f.remediation ?? ''}`.toLowerCase();

/** Drops sentences that tell the reader to validate FAQ or HowTo markup in Google's Rich Results Test. */
export function stripRichResultsAdvice(value: string): string {
  const sentences = value.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !(/rich results? test/i.test(s) && /faq|how-?to/i.test(s + ' ' + value)));
  return kept.join(' ').trim();
}

const topicOf = {
  bots: /gptbot|claudebot|ccbot|bytespider|training crawlers?|crawler access|user[- ]agent/,
  jsGap: /javascript|server-?side render|pre-?render|static (html|fallback)|ssr\b|csr\b|client-side render/,
  schemaJs: /schema.*(javascript|rendered)/,
  navLinks: /(navigation|nav|footer).*(button|link|anchor)|real (<a>|anchor|link)/
};

// Two pieces of text are "about the same thing" when most of the shorter one's significant words
// appear in the other (needs at least three, so a short phrase cannot match everything).
const sig = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
const overlaps = (a: string, b: string) => {
  const x = sig(a), y = sig(b);
  if (x.size < 3 || y.size < 3) return false;
  let n = 0;
  x.forEach((w) => { if (y.has(w)) n++; });
  return n / Math.min(x.size, y.size) >= 0.6;
};

// Field names and identifiers the model sometimes quotes from the payload, in plain words.
const PLAIN: Array<[RegExp, string]> = [
  [/\bsitemapFound\s*[:=]?\s*false\b/gi, 'no sitemap was found'],
  [/\bllmsTxtFound\s*[:=]?\s*false\b/gi, 'no llms.txt was found'],
  [/\brobotsTxtAllows\b/g, 'the robots.txt rules'],
  [/\bstructuredData\.hasJsonLd\b/g, 'structured data (JSON-LD)'],
  [/\bmissingAltCount\b/g, 'the number of images without an alt attribute'],
  [/\bimagesMissingAltAttribute\b/g, 'images without an alt attribute'],
  [/\bimagesWithEmptyAltDecorativeValid\b/g, 'images with empty (decorative) alt text'],
  [/\bmeta\.canonical\b/g, 'the canonical tag'],
  [/\bvisibleSections\.(\w+)\b/g, 'the $1 section'],
  [/\bgenuineReviewsVisible\b/g, 'visible customer reviews'],
  [/\bisSimulatedData\b/g, 'placeholder data'],
  [/\brefusalVerdict\b/g, 'refusal result']
];
export const plainEnglish = (s: string): string => (typeof s === 'string' ? PLAIN.reduce((acc, [re, to]) => acc.replace(re, to), s) : s);

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url || 'the site'; } };

/** Honest report for a scan that never saw the real page. No finding is derived from placeholder or challenge-page data. */
export function unreadableReport(draft: DeepSeekSeoReport, crawl: CrawlResult): DeepSeekSeoReport {
  const host = hostOf(crawl.rootUrl);
  const challenge = crawl.pageKind === 'challenge';
  const reason = crawl.challengeReason || 'reason not identified';
  const headline = challenge
    ? `The site served a bot challenge (${reason}) so the real page could not be audited.`
    : 'The site could not be read, so no findings about its content can be reported.';
  const summary = challenge
    ? `Live data could not be retrieved for ${host}: the site served a bot challenge (${reason}) instead of its real page, so the title, description, headings and links this scan saw belong to the challenge, not to your site. This is not an audit of ${host}; no scores or findings about its content are reported.`
    : `Live data could not be retrieved for ${host}: the site could not be reached or read during this scan (offline, blocked, or timed out). This is not an audit of ${host}; the scores shown are illustrative placeholders and no findings about its content are reported.`;
  // What was actually read may still be reported: robots.txt's own rules about named crawlers.
  const disallowed = Object.entries(crawl.robotsByCrawler ?? {}).filter(([, v]) => v === 'disallowed').map(([k]) => k);
  const robotsNote = disallowed.length ? ` One thing was read directly: robots.txt disallows ${disallowed.join(', ')}.` : '';
  const fixes: Fix[] = [
    {
      title: 'Check whether bot protection is blocking automated clients',
      category: 'technical', priority: 'medium',
      description: challenge
        ? `The scanner was shown a challenge page (${reason}) instead of ${host}. Bot-protection or CDN rules that challenge headless or automated clients can also stop search engines and AI crawlers from reading the site, though verified crawlers are often exempt.`
        : `The scanner could not read ${host}. A firewall, CDN or bot-protection rule that refuses automated clients is one possible cause (an outage or a wrong address are others).`,
      remediation: 'Look at your CDN, WAF or server logs for the time of the scan. If automated requests were refused or challenged, allow-list the scanner or confirm that verified search crawlers are exempt (Google Search Console and Bing Webmaster Tools show what the real crawlers receive).'
    },
    {
      title: 'Re-run the audit once the site is readable',
      category: 'technical', priority: 'low',
      description: 'No audit of the real page took place, so there is nothing to fix yet.',
      remediation: `Confirm ${crawl.rootUrl} loads in a normal browser and is publicly reachable, then run the scan again.`
    }
  ];
  const removed = [
    ...(draft.criticalIssues ?? []).map((title) => ({ title, reason: 'derived from placeholder or challenge-page data, not from the site' })),
    ...(draft.recommendedFixes ?? []).map((f) => ({ title: f.title, reason: 'derived from placeholder or challenge-page data, not from the site' }))
  ];
  const criticalIssues = [headline];
  const prompt = [
    `The automated SEO / AEO audit of ${crawl.rootUrl} could not read the real site, so there are no findings to implement.`,
    '',
    'WHAT HAPPENED',
    summary + robotsNote,
    '',
    'WHAT TO DO',
    ...fixes.map((f, i) => `${i + 1}. ${f.title}: ${f.remediation}`),
    '',
    'RULES',
    '- Do not change the site to "fix" anything this scan reported: it reported nothing about the real page.'
  ].join('\n');
  return {
    ...draft,
    score: draft.score ?? { overall: 0, technical: 0, content: 0, aeoGeo: 0, performance: 0 },
    scoreMethod: 'illustrative',
    scoreBreakdown: undefined,
    executiveSummary: summary + robotsNote,
    criticalIssues,
    recommendedFixes: fixes,
    aeoAssessment: { generativeFriendlinessScore: draft.score?.aeoGeo ?? 0, directAnswerFriendliness: 'Not assessed: the real page could not be read.', richSnippetEligibility: [], voiceSearchOptimized: false, recommendationsForAeo: [] },
    competitorComparisonText: undefined,
    qa: { removed, added: [] },
    agentReadyPrompt: {
      title: `Find out why ${host} could not be audited`,
      prompt,
      checklist: fixes.map((f) => f.title)
    }
  };
}

export function finalizeReport(input: DeepSeekSeoReport, crawl: CrawlResult): DeepSeekSeoReport {
  const report: DeepSeekSeoReport = JSON.parse(JSON.stringify(input));
  const facts = crawl.facts;
  const removed: Array<{ title: string; reason: string }> = [];
  const added: string[] = [];

  // The page could not be read (placeholder data) or was a bot challenge, not the site: nothing about
  // its content may be reported. Build an honest report from scratch instead of keeping the draft.
  if (crawl.hasSimulatedData || crawl.pageKind === 'challenge') return unreadableReport(report, crawl);

  // 1. Remove what the evidence contradicts; clean out stale advice.
  report.recommendedFixes = (report.recommendedFixes ?? []).flatMap((fix) => {
    const cleaned: Fix = {
      ...fix,
      description: stripRichResultsAdvice(fix.description ?? ''),
      remediation: stripRichResultsAdvice(fix.remediation ?? '')
    };
    const reason = contradiction(textOf(cleaned), crawl);
    if (reason) { removed.push({ title: fix.title, reason }); return []; }
    // A fix whose only action was the removed advice has nothing left to do.
    if ((fix.remediation && !cleaned.remediation) || (!cleaned.description && !cleaned.remediation)) { removed.push({ title: fix.title, reason: 'it only advised validating FAQ/HowTo in the Rich Results Test, which no longer applies' }); return []; }
    return [cleaned];
  });
  const removedFixes = removed.map((r) => r.title);
  const removedFixTexts = (input.recommendedFixes ?? []).filter((f) => removedFixes.includes(f.title)).map((f) => `${f.title} ${f.description ?? ''}`);
  report.criticalIssues = (report.criticalIssues ?? []).filter((issue) => {
    let reason = contradiction(issue.toLowerCase(), crawl);
    // A critical issue about the same thing as a suggestion the evidence removed is contradicted too,
    // so the two lists cannot disagree.
    if (!reason && removedFixTexts.some((t) => overlaps(issue, t))) reason = 'it is about the same thing as a suggestion the evidence contradicted';
    if (reason) removed.push({ title: issue, reason });
    return !reason;
  });

  // 2. Findings that need no judgement, straight from the measurements.
  const bots = facts?.botAccess;
  const rvr = facts?.rawVsRendered;
  const newFixes: Fix[] = [];

  const measuredCritical = new Set<string>();
  if (bots) {
    // Only genuine blocks are findings. A refusal that robots.txt itself asks for is policy; one that
    // cannot be told apart from a spoofed-request refusal is inconclusive (see botVerdict.ts).
    const cls = classifyBots(bots);
    const { genuineSearch: blockedSearch, genuineTraining: blockedTraining } = cls;
    const status = (r: { name: string; status: number }) => `${r.name} (HTTP ${r.status || 'no response'})`;
    const allowedSearch = bots.results.filter((r) => !r.blocked && r.role !== 'training').map((r) => r.name);
    if (cls.inconclusiveSearch.length) {
      const names = cls.inconclusiveSearch.map(status).join(', ');
      newFixes.push({
        title: 'Confirm whether search crawlers can reach your site (this scan could not tell)',
        category: 'aeo-geo', priority: 'low',
        description: bots.baselineRefused
          ? `The site refused ordinary non-browser requests (HTTP ${bots.baselineStatus || 'no response'}) before any crawler identity mattered, so the per-crawler results (${names}) cannot show who is welcome. What can be concluded: this test proves nothing either way. What cannot be concluded: that the real crawlers are blocked.`
          : `${names} refused a request that only imitated their published user agent. These crawlers are verified by IP address or reverse DNS, so refusing an imitation is normal behaviour. What can be concluded: nothing about the real crawlers either way. What cannot be concluded: that they are blocked.`,
        remediation: 'Confirm with the engines themselves: Google Search Console (URL Inspection and Crawl stats), Bing Webmaster Tools (URL Inspection and crawl information), and your server or CDN logs filtered to the vendors\' published IP ranges. Act only if those show the real crawlers receiving errors.'
      });
      added.push('crawler refusals that cannot be confirmed as blocks');
    }
    if (cls.policy.length) added.push(`crawlers disallowed by robots.txt and refused, consistent with the site's policy: ${cls.policy.map((r) => r.name).join(', ')}`);
    if (blockedSearch.length) {
      const line = `Search or assistant crawlers are refused by the site: ${blockedSearch.map((r) => r.name).join(', ')}.`;
      measuredCritical.add(line);
      report.criticalIssues.unshift(line);
      newFixes.push({
        title: 'Let search and assistant crawlers through your CDN or firewall',
        category: 'aeo-geo', priority: 'high',
        description: `${blockedSearch.map(status).join(', ')} ${blockedSearch.length === 1 ? 'was' : 'were'} refused when requesting the home page with ${blockedSearch.length === 1 ? 'its' : 'their'} published user agent. A page a crawler cannot fetch cannot be indexed or cited by the engine or assistant behind it.${blockedSearch.every((r) => r.robotsAllows === true) && cls.conflicts.length ? ` robots.txt allows ${blockedSearch.length === 1 ? 'it' : 'them'}, so the site says "welcome" and then refuses.` : ''}`,
        remediation: 'In your CDN, WAF or bot-protection settings, allow these crawlers (verify them by their vendors\' published IP ranges or reverse DNS rather than by user agent alone), then re-run the audit.'
      });
      added.push('search/assistant crawlers blocked');
    }
    if (blockedTraining.length) {
      newFixes.push({
        title: 'Decide, and state, whether AI-training crawlers are welcome',
        category: 'aeo-geo', priority: blockedSearch.length ? 'medium' : 'low',
        description: `${blockedTraining.map(status).join(', ')} ${blockedTraining.length === 1 ? 'was' : 'were'} refused${cls.conflicts.some((c) => blockedTraining.some((r) => r.name === c)) ? ` even though robots.txt does not disallow ${blockedTraining.length === 1 ? 'it' : 'them'}` : ''}. ${allowedSearch.length ? `Search and assistant crawlers (${allowedSearch.slice(0, 6).join(', ')}) were let through, so answer-engine citation is not affected by this. ` : ''}Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch between policy and behaviour.`,
        remediation: 'If the block is intentional, add matching "User-agent: … / Disallow: /" rules to robots.txt so crawlers and humans see the same policy. If it is not, allow them in your CDN bot settings.'
      });
      added.push('AI-training crawler block');
    }
  }

  const rawUsable = !!rvr && !rvr.rawChallenge && !rvr.rawFetchUnreliable;
  if (rvr && rawUsable && rvr.rawWords < rvr.renderedWords * 0.4 && rvr.renderedWords >= 200 && rvr.renderedWords - rvr.rawWords > 150) {
    const severe = rvr.rawWords < 100;
    if (severe) {
      const line = `Without JavaScript the page contains only ${rvr.rawWords} words (${rvr.renderedWords} once scripts run).`;
      measuredCritical.add(line);
      report.criticalIssues.unshift(line);
    }
    newFixes.push({
      title: 'Put the main content in the HTML the server sends',
      category: 'aeo-geo', priority: severe ? 'high' : 'medium',
      description: `A plain request with no JavaScript returns ${rvr.rawWords} words and ${rvr.rawLinks} links; after a real browser runs the page it is ${rvr.renderedWords} words and ${rvr.renderedLinks} links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version.`,
      remediation: 'Server-render or pre-render the headline, main sections, FAQ and navigation into the initial HTML (or ship a static fallback generated at build time), so the content does not depend on scripts.'
    });
    added.push('JavaScript-dependent content');
  }

  if (rvr && rawUsable && rvr.schemaOnlyAfterJs.length) {
    newFixes.push({
      title: 'Serve structured data in the initial HTML',
      category: 'technical', priority: 'medium',
      description: `These schema types appear only after JavaScript runs: ${rvr.schemaOnlyAfterJs.join(', ')}. Crawlers that do not run scripts will not see them.`,
      remediation: 'Emit the JSON-LD blocks in the server-delivered HTML (in the document head or body) rather than injecting them from client-side code.'
    });
    added.push('schema only after JavaScript');
  }

  for (const inv of facts?.schema?.invisible ?? []) {
    newFixes.push({
      title: `Make ${inv.type} markup match the visible page`,
      category: 'technical', priority: 'medium',
      description: `${inv.items.length} of ${inv.total} ${inv.type === 'HowTo' ? 'steps' : 'questions'} in the ${inv.type} markup (for example "${inv.items[0]}") do not appear in the text a visitor sees. Markup is meant to describe content that is visible on the page.`,
      remediation: `Either show this content on the page or remove it from the ${inv.type} markup, so the markup and the page agree.`
    });
    added.push(`${inv.type} markup not visible`);
  }

  if (rvr && navButtonsMatter(rvr)) {
    newFixes.push({
      title: 'Use real links for navigation',
      category: 'technical', priority: 'medium',
      description: `Header, navigation and footer contain ${rvr.navButtons} buttons but only ${rvr.navAnchors} real <a href> links. Crawlers follow links; they do not click buttons, so those destinations are invisible to them.`,
      remediation: 'Render navigation and footer entries as <a href="…"> elements (a styled button can still be an anchor).'
    });
    added.push('navigation built from buttons');
  }

  // Replace the model's own take on a topic we measured, so there is one accurate finding, not two.
  const botsMeasured = !!bots && bots.results.some((r) => r.blocked);
  const jsMeasured = newFixes.some((n) => n.title.startsWith('Put the main content'));
  const navMeasured = newFixes.some((n) => n.title.startsWith('Use real links'));
  report.recommendedFixes = report.recommendedFixes.filter((f) => {
    const txt = textOf(f);
    const dup =
      (botsMeasured && topicOf.bots.test(txt)) ||
      (jsMeasured && topicOf.jsGap.test(txt) && /(content|render|raw|html)/.test(txt)) ||
      (navMeasured && topicOf.navLinks.test(txt));
    if (dup) removed.push({ title: f.title, reason: 'replaced by a measured finding on the same topic' });
    return !dup;
  });
  // The model often says the same thing about markup that is not visible; keep only the measured version.
  const invisibleTypes = (facts?.schema?.invisible ?? []).map((i) => i.type.toLowerCase());
  if (invisibleTypes.length) {
    report.recommendedFixes = report.recommendedFixes.filter((f) => {
      // Judge by what the fix is about (its title), not by incidental words in its body.
      const title = f.title.toLowerCase();
      const aliases: Record<string, string[]> = { faqpage: ['faq'], howto: ['howto', 'how-to', 'how to'] };
      const dup = invisibleTypes.some((t) => (aliases[t] ?? [t]).some((a) => title.includes(a)) && /(visible|match|align|markup|schema|structured data)/.test(title));
      if (dup) removed.push({ title: f.title, reason: 'replaced by a measured finding on the same topic' });
      return !dup;
    });
  }
  // The score deducts for a missing sitemap, so the report must say so (only when it was really checked).
  if (!crawl.sitemapFound && crawl.sitemapChecked !== false && !report.recommendedFixes.some((f) => /sitemap/i.test(f.title))) {
    newFixes.push({
      title: 'Publish an XML sitemap',
      category: 'technical', priority: 'low',
      description: 'No sitemap was found at the usual locations or in robots.txt. A sitemap helps crawlers discover every page, especially new or deeply linked ones; this scan deducted a few technical points for it.',
      remediation: 'Generate a sitemap.xml listing your canonical URLs, publish it, and add a "Sitemap: https://your-domain/sitemap.xml" line to robots.txt.'
    });
    added.push('no sitemap found');
  }

  // A language switcher with no hreflang is a real, measurable gap.
  const locales = facts?.signals?.localeLinks;
  if (locales && locales.length >= 3 && !(crawl.mainPage.hreflang && crawl.mainPage.hreflang.length)) {
    newFixes.push({
      title: 'Declare hreflang for the language versions you link to',
      category: 'technical', priority: 'medium',
      description: `The page links to ${locales.length} language versions (for example ${locales.slice(0, 4).join(', ')}) but declares no hreflang annotations, so search engines are not told which version belongs to which language or region.`,
      remediation: 'Add <link rel="alternate" hreflang="..." href="..."> entries (including x-default) for every language version, in each version\'s <head>, and make sure they reference each other.'
    });
    added.push('language versions without hreflang');
  }

  report.recommendedFixes = [...newFixes, ...report.recommendedFixes];

  // A blocked AI-training crawler is the owner's policy decision (covered by its own low-priority
  // finding), so a critical issue that is only about that is demoted rather than shouted.
  const TRAINING = ['gptbot', 'claudebot', 'ccbot', 'bytespider'];
  const SEARCHY = ['oai-searchbot', 'claude-searchbot', 'perplexitybot', 'googlebot', 'bingbot', 'applebot', 'chatgpt-user', 'claude-user', 'perplexity-user'];
  if (bots && newFixes.some((n) => n.title.startsWith('Decide, and state'))) {
    report.criticalIssues = report.criticalIssues.filter((issue) => {
      const low = issue.toLowerCase();
      const onlyTraining = TRAINING.some((n) => low.includes(n)) && !SEARCHY.some((n) => low.includes(n));
      if (onlyTraining) removed.push({ title: issue, reason: 'blocking AI-training crawlers is a policy decision, reported as its own low-priority finding' });
      return !onlyTraining;
    });
  }

  // Calibrate the model's severity against the measurements. It tends to shout ("severe", "critical",
  // "high") about numbers that do not warrant it.
  const page = crawl.mainPage;
  const networkBound = !!page.ttfbMs && !!page.loadTimeMs && page.ttfbMs / page.loadTimeMs >= 0.7;
  const NOTE = ' (Measured from the scanning host, so part of this may be network distance; confirm from where your visitors are.)';
  const downgrade = (f: Fix) => ({ ...f, priority: (f.priority === 'high' ? 'medium' : f.priority) as Fix['priority'] });
  if (networkBound) {
    report.recommendedFixes = report.recommendedFixes.map((f) => {
      if (!/ttfb|time to first byte|server response|response time|\blcp\b|largest contentful/.test(textOf(f))) return f;
      const out = downgrade(f);
      if (!/scanning host|auditing host/i.test(out.description)) out.description = out.description + NOTE;
      return out;
    });
  }
  // A moderate JavaScript gap is a medium finding, not a critical one; only the measured severe case is critical.
  if (rvr && rawUsable && !newFixes.some((n) => n.title.startsWith('Put the main content'))) {
    const jsText = (t: string) => /javascript|client-side render|server-?side render|pre-?render|raw html/.test(t);
    report.criticalIssues = report.criticalIssues.filter((issue) => {
      // Navigation built from buttons is its own finding, not a JavaScript-gap one.
      const drop = jsText(issue.toLowerCase()) && !/button|anchor/.test(issue.toLowerCase());
      if (drop) removed.push({ title: issue, reason: `the gap is moderate (${rvr.rawWords} of ${rvr.renderedWords} words are in the raw HTML), so it is reported as a medium finding, not critical` });
      return !drop;
    });
    report.recommendedFixes = report.recommendedFixes.map((f) => (jsText(textOf(f)) ? downgrade(f) : f));
  }

  // The model's own "crawler X is blocked" criticals: either replaced by the measured finding, or
  // wrong because the refusal is policy / inconclusive.
  if (bots && bots.results.some((r) => r.blocked)) {
    const cls = classifyBots(bots);
    const names = bots.results.map((r) => r.name.toLowerCase());
    report.criticalIssues = report.criticalIssues.filter((issue) => {
      if (measuredCritical.has(issue)) return true;
      const low = issue.toLowerCase();
      const about = (topicOf.bots.test(low) || names.some((n) => low.includes(n))) && /block|refus|den(?:y|ied)|forbidden|403|disallow|turned? away|ambiguous|policy/.test(low);
      if (about) removed.push({ title: issue, reason: cls.genuineSearch.length ? 'replaced by the measured crawler-access finding' : 'the refusals match robots.txt policy or cannot be confirmed as blocks, so this is not a critical issue' });
      return !about;
    });
  }

  // Severity calibration. The model calls too much "critical". Only conditions we measured as severe
  // stay critical; everything else moves to the fix list (once) and the move is recorded in qa.
  const sec = crawl.securityHeaders;
  const severe = (issue: string): boolean => {
    if (measuredCritical.has(issue)) return true;
    const low = issue.toLowerCase();
    if (crawl.robotsBlocksAll === true && /robots/.test(low)) return true;
    if (/noindex/i.test(page.meta.robots || '') && /noindex|not be indexed|de-?index/.test(low)) return true;
    if (sec && !sec.https && /https|plain http|insecure|\bssl\b|\btls\b/.test(low)) return true;
    if (!page.meta.title && /<title>|title tag|page title|missing title|no title|title is missing/.test(low)) return true;
    if (!page.headings.h1.length && /\bh1\b|main heading/.test(low)) return true;
    return false;
  };
  const demoted: Array<{ title: string; reason: string }> = [];
  report.criticalIssues = report.criticalIssues.filter((issue) => {
    if (severe(issue)) return true;
    demoted.push({ title: issue, reason: 'not one of the measured severe conditions (robots blocks all, noindex, HTTPS missing, genuinely blocked search crawlers, severe JavaScript gap, no title, no H1); moved to recommended fixes' });
    if (!report.recommendedFixes.some((f) => overlaps(issue, `${f.title} ${f.description}`))) {
      const low = issue.toLowerCase();
      report.recommendedFixes.push({
        title: issue.length > 90 ? `${issue.slice(0, 87)}...` : issue.replace(/\.$/, ''),
        category: /load|speed|ttfb|lcp|cls|perform|slow/.test(low) ? 'performance' : /schema|json-?ld|crawler|\bai\b|aeo|llms|answer/.test(low) ? 'aeo-geo' : /content|word|heading|alt\b|image|description|title/.test(low) ? 'content' : 'technical',
        priority: /minor|suffix|optional|polish|open graph|og:|twitter|\blang\b|nit\b/.test(low) ? 'low' : 'medium',
        description: issue,
        remediation: 'Review this where it applies to your site. It was flagged as important but is not a measured severe defect, so it is listed as a normal recommendation.'
      });
    }
    return false;
  });

  // Priority caps for things whose benefit is unproven or retired.
  const cap = (f: Fix, to: Fix['priority'], note?: string): Fix => {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    // Lower the priority to `to` only when it is currently more severe than that.
    return { ...f, priority: rank[f.priority] < rank[to] ? to : f.priority, description: note && !f.description.includes(note) ? `${f.description} ${note}` : f.description };
  };
  const LLMS_NOTE = 'Note: llms.txt is optional and not yet confirmed to be read by the major search engines or assistants, so treat it as low priority.';
  report.recommendedFixes = report.recommendedFixes.map((f) => {
    const title = f.title.toLowerCase();
    if (/llms\.txt/.test(title)) return cap(f, 'low', LLMS_NOTE);
    if (/faqpage|faq (schema|markup)|searchaction/.test(title)) return cap(f, 'low');
    if (/redirect/.test(title)) return cap(f, 'medium');
    return f;
  });

  // 3. AEO notes: FAQ/HowTo rich results are gone, but the markup is still valid.
  if (report.aeoAssessment) {
    report.aeoAssessment.richSnippetEligibility = (report.aeoAssessment.richSnippetEligibility ?? []).filter((t) => !/faq|how-?to/i.test(t));
    const types = new Set([...(rvr?.renderedSchemaTypes ?? []), ...(rvr?.rawSchemaTypes ?? [])]);
    if (types.has('FAQPage') || types.has('HowTo')) {
      report.aeoAssessment.recommendationsForAeo = [
        ...(report.aeoAssessment.recommendationsForAeo ?? []).map(stripRichResultsAdvice).filter(Boolean),
        'FAQPage and HowTo markup is still valid and helps machines read your questions and steps, but Google no longer shows FAQ or HowTo rich results, so there is no rich result to validate.'
      ];
    } else {
      report.aeoAssessment.recommendationsForAeo = (report.aeoAssessment.recommendationsForAeo ?? []).map(stripRichResultsAdvice).filter(Boolean);
    }
  }

  // Wording: payload field names must not leak into sentences a person reads.
  report.executiveSummary = plainEnglish(report.executiveSummary);
  report.criticalIssues = report.criticalIssues.map(plainEnglish);
  report.recommendedFixes = report.recommendedFixes.map((f) => ({ ...f, title: plainEnglish(f.title), description: plainEnglish(f.description), remediation: plainEnglish(f.remediation) }));
  if (report.aeoAssessment) {
    report.aeoAssessment.directAnswerFriendliness = plainEnglish(report.aeoAssessment.directAnswerFriendliness);
    report.aeoAssessment.richSnippetEligibility = (report.aeoAssessment.richSnippetEligibility ?? []).filter((t) => !/sitelinks? search ?box/i.test(t));
    report.aeoAssessment.recommendationsForAeo = (report.aeoAssessment.recommendationsForAeo ?? []).map(plainEnglish);
  }

  // 4. Scores come from the measurements, with every deduction listed.
  const { score, breakdown } = computeScores(crawl);
  report.score = score;
  report.scoreMethod = 'measured';
  report.scoreBreakdown = breakdown;
  if (report.aeoAssessment) report.aeoAssessment.generativeFriendlinessScore = score.aeoGeo;
  report.qa = { removed, added, demoted };

  // 5. The hand-off prompt must describe the final report, not the draft: rebuild it from the
  // checked fixes and computed scores so it cannot repeat anything that was removed.
  report.agentReadyPrompt = buildAgentReadyPrompt({
    url: crawl.rootUrl,
    score: report.score,
    criticalIssues: report.criticalIssues,
    recommendedFixes: report.recommendedFixes,
    aeoAssessment: report.aeoAssessment,
    executiveSummary: report.executiveSummary,
    isSimulated: crawl.hasSimulatedData
  });

  return report;
}
