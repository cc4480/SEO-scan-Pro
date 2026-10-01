import type { CrawlResult, DeepSeekSeoReport } from '../../src/types';
import { buildAgentReadyPrompt } from '../../src/agentPrompt';
import { computeScores } from './scoring';
import { contradiction } from './contradiction';

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

export function finalizeReport(input: DeepSeekSeoReport, crawl: CrawlResult): DeepSeekSeoReport {
  const report: DeepSeekSeoReport = JSON.parse(JSON.stringify(input));
  const facts = crawl.facts;
  const removed: Array<{ title: string; reason: string }> = [];
  const added: string[] = [];

  if (crawl.hasSimulatedData) {
    report.scoreMethod = 'illustrative';
    return report;
  }

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
  report.criticalIssues = (report.criticalIssues ?? []).filter((issue) => {
    const reason = contradiction(issue.toLowerCase(), crawl);
    if (reason) removed.push({ title: issue, reason });
    return !reason;
  });

  // 2. Findings that need no judgement, straight from the measurements.
  const bots = facts?.botAccess;
  const rvr = facts?.rawVsRendered;
  const newFixes: Fix[] = [];

  if (bots) {
    const blockedSearch = bots.results.filter((r) => r.blocked && r.role !== 'training');
    const blockedTraining = bots.results.filter((r) => r.blocked && r.role === 'training');
    const status = (r: { name: string; status: number }) => `${r.name} (HTTP ${r.status || 'no response'})`;
    const allowedSearch = bots.results.filter((r) => !r.blocked && r.role !== 'training').map((r) => r.name);
    if (blockedSearch.length) {
      report.criticalIssues.unshift(`Search or assistant crawlers are refused by the site: ${blockedSearch.map((r) => r.name).join(', ')}.`);
      newFixes.push({
        title: 'Let search and assistant crawlers through your CDN or firewall',
        category: 'aeo-geo', priority: 'high',
        description: `These crawlers were refused when requesting the home page with their published user agents: ${blockedSearch.map(status).join(', ')}. Pages they cannot fetch cannot be indexed or cited by the engines and assistants behind them.${bots.conflicts.length ? ' robots.txt allows them, so the site is saying "welcome" and then refusing.' : ''}`,
        remediation: 'In your CDN, WAF or bot-protection settings, allow these crawlers (verify them by their vendors\' published IP ranges or reverse DNS rather than by user agent alone), then re-run the audit.'
      });
      added.push('search/assistant crawlers blocked');
    }
    if (blockedTraining.length) {
      newFixes.push({
        title: 'Decide, and state, whether AI-training crawlers are welcome',
        category: 'aeo-geo', priority: blockedSearch.length ? 'medium' : 'low',
        description: `${blockedTraining.map(status).join(', ')} were refused${bots.conflicts.some((c) => blockedTraining.some((r) => r.name === c)) ? ' even though robots.txt does not disallow them' : ''}. ${allowedSearch.length ? `Search and assistant crawlers (${allowedSearch.slice(0, 6).join(', ')}) were let through, so answer-engine citation is not affected by this. ` : ''}Whether to block AI-training crawlers is the site owner's choice; the problem is only a mismatch between policy and behaviour.`,
        remediation: 'If the block is intentional, add matching "User-agent: … / Disallow: /" rules to robots.txt so crawlers and humans see the same policy. If it is not, allow them in your CDN bot settings.'
      });
      added.push('AI-training crawler block');
    }
  }

  if (rvr && rvr.rawWords < rvr.renderedWords * 0.4 && rvr.renderedWords >= 200 && rvr.renderedWords - rvr.rawWords > 150) {
    const severe = rvr.rawWords < 100;
    if (severe) report.criticalIssues.unshift(`Without JavaScript the page contains only ${rvr.rawWords} words (${rvr.renderedWords} once scripts run).`);
    newFixes.push({
      title: 'Put the main content in the HTML the server sends',
      category: 'aeo-geo', priority: severe ? 'high' : 'medium',
      description: `A plain request with no JavaScript returns ${rvr.rawWords} words and ${rvr.rawLinks} links; after a real browser runs the page it is ${rvr.renderedWords} words and ${rvr.renderedLinks} links. It is commonly reported that many AI retrieval crawlers do not execute JavaScript (this scan did not test each crawler), so they may see only the smaller version.`,
      remediation: 'Server-render or pre-render the headline, main sections, FAQ and navigation into the initial HTML (or ship a static fallback generated at build time), so the content does not depend on scripts.'
    });
    added.push('JavaScript-dependent content');
  }

  if (rvr?.schemaOnlyAfterJs.length) {
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

  if (rvr && rvr.navButtons > rvr.navAnchors && rvr.navButtons >= 3) {
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
  if (rvr && !newFixes.some((n) => n.title.startsWith('Put the main content'))) {
    const jsText = (t: string) => /javascript|client-side render|server-?side render|pre-?render|raw html/.test(t);
    report.criticalIssues = report.criticalIssues.filter((issue) => {
      // Navigation built from buttons is its own finding, not a JavaScript-gap one.
      const drop = jsText(issue.toLowerCase()) && !/button|anchor/.test(issue.toLowerCase());
      if (drop) removed.push({ title: issue, reason: `the gap is moderate (${rvr.rawWords} of ${rvr.renderedWords} words are in the raw HTML), so it is reported as a medium finding, not critical` });
      return !drop;
    });
    report.recommendedFixes = report.recommendedFixes.map((f) => (jsText(textOf(f)) ? downgrade(f) : f));
  }

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

  // 4. Scores come from the measurements, with every deduction listed.
  const { score, breakdown } = computeScores(crawl);
  report.score = score;
  report.scoreMethod = 'measured';
  report.scoreBreakdown = breakdown;
  if (report.aeoAssessment) report.aeoAssessment.generativeFriendlinessScore = score.aeoGeo;
  report.qa = { removed, added };

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
