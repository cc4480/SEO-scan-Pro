import { describe, it, expect, vi } from 'vitest';
import type { CrawlResult, DeepSeekSeoReport, SchemaEntity } from '../../src/types';
import { robotsAllows } from '../../lib/audit/robotsRules';
import { anchorCount, invisibleSchemaItems, navigationControls, schemaEntities, schemaTypes, textOf, wordCount } from '../../lib/audit/htmlFacts';
import { contentSignals } from '../../lib/audit/contentSignals';
import { computeScores } from '../../lib/audit/scoring';
import { contradiction, finalizeReport, stripRichResultsAdvice } from '../../lib/audit/finalize';
import { isRefusal } from '../../lib/audit/botAccess';

// ---------------------------------------------------------------------------------------------
// robots.txt

describe('robotsAllows', () => {
  it('allows everything when there are no rules', () => {
    expect(robotsAllows('', 'GPTBot')).toBe(true);
    expect(robotsAllows('User-agent: *\nDisallow:', 'GPTBot')).toBe(true);
  });

  it('applies the most specific group, not the wildcard', () => {
    const txt = 'User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /';
    expect(robotsAllows(txt, 'GPTBot')).toBe(false);
    expect(robotsAllows(txt, 'ClaudeBot')).toBe(true);
  });

  it('uses the longest matching rule, with Allow winning ties', () => {
    const txt = 'User-agent: *\nDisallow: /private\nAllow: /private/public';
    expect(robotsAllows(txt, 'x', '/private/a')).toBe(false);
    expect(robotsAllows(txt, 'x', '/private/public/a')).toBe(true);
    expect(robotsAllows('User-agent: *\nDisallow: /a\nAllow: /a', 'x', '/a')).toBe(true);
  });

  it('supports * and $ patterns and ignores comments', () => {
    const txt = 'User-agent: *  # everyone\nDisallow: /*.pdf$\n';
    expect(robotsAllows(txt, 'x', '/files/a.pdf')).toBe(false);
    expect(robotsAllows(txt, 'x', '/files/a.pdf.html')).toBe(true);
  });

  it('treats a site-wide Disallow as blocking the root', () => {
    expect(robotsAllows('User-agent: *\nDisallow: /', 'Googlebot', '/')).toBe(false);
  });
});

describe('isRefusal', () => {
  it('counts 401/403/406/429 and failures as refusals, but not when the site refuses everyone', () => {
    expect(isRefusal(403, 200)).toBe(true);
    expect(isRefusal(429, 200)).toBe(true);
    expect(isRefusal(0, 200)).toBe(true);
    expect(isRefusal(200, 200)).toBe(false);
    expect(isRefusal(404, 200)).toBe(false);
    expect(isRefusal(403, 403)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// HTML facts

const LD = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

describe('structured data parsing', () => {
  const html = [
    LD({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'App', applicationCategory: 'SecurityApplication', operatingSystem: 'Web', softwareVersion: '1.0.0', offers: { '@type': 'Offer', price: '29.00', priceCurrency: 'USD' } }),
    LD({ '@graph': [{ '@type': 'Organization', name: 'Org' }, { '@type': 'WebSite', url: 'https://x.test' }] }),
    LD({ '@type': 'HowTo', name: 'Do it', totalTime: 'PT5M', step: [{ '@type': 'HowToStep', name: 'Connect your repo' }, { '@type': 'HowToStep', name: 'Run the scan' }] }),
    LD({ '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'How much does it cost?' }] })
  ].join('');

  it('reads types and the properties each entity really has', () => {
    const entities = schemaEntities(html);
    const app = entities.find((e) => e.type === 'SoftwareApplication')!;
    expect(app.props).toEqual(expect.arrayContaining(['applicationCategory', 'operatingSystem', 'offers']));
    expect(app.prices).toEqual([{ price: '29.00', currency: 'USD' }]);
    expect(app.version).toBe('1.0.0');
    expect(entities.find((e) => e.type === 'HowTo')!.totalTime).toBe('PT5M');
    expect(schemaTypes(entities)).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'HowTo', 'FAQPage', 'Offer']));
  });

  it('ignores malformed JSON-LD instead of failing', () => {
    expect(schemaEntities('<script type="application/ld+json">{oops</script>')).toEqual([]);
  });

  it('flags markup whose steps and questions are not on the visible page', () => {
    const entities = schemaEntities(html);
    const visible = 'Connect your repo and then run the scan. Pricing is simple.';
    const inv = invisibleSchemaItems(entities, visible);
    expect(inv.find((i) => i.type === 'HowTo')).toBeUndefined(); // both steps are visible
    expect(inv.find((i) => i.type === 'FAQPage')!.items).toEqual(['How much does it cost?']);
  });
});

describe('text and link counting', () => {
  it('counts the noscript block for a raw response but not for a rendered DOM', () => {
    const html = '<body><div id="root">App</div><noscript>one two three four five</noscript><script>var a = "ignored words here";</script></body>';
    expect(wordCount(textOf(html, true))).toBe(6);
    expect(wordCount(textOf(html, false))).toBe(1);
  });

  it('counts only real anchors, not buttons with click handlers', () => {
    const html = '<nav><button onclick="go()">Docs</button><button>Pricing</button><a href="/privacy">Privacy</a></nav><a href="#top">Top</a>';
    expect(anchorCount(html, true)).toBe(1);
  });

  it('reports navigation controls that are buttons rather than links', () => {
    const html = '<header><button>Docs</button><button>FAQ</button></header><footer><button>Terms</button><a href="/x">x</a></footer>';
    expect(navigationControls(html)).toEqual({ buttons: 3, anchors: 1 });
  });
});

describe('word counting with inline markup', () => {
  it('does not split words when every letter is wrapped in a span', () => {
    const lettered = '<p>' + 'This domain'.split('').map((c) => '<span>' + c + '</span>').join('') + '</p><p>Second paragraph</p>';
    expect(wordCount(textOf(lettered, false))).toBe(4);
  });
  it('still separates adjacent block elements', () => {
    expect(textOf('<h1>Hello</h1><p>World</p>', false)).toBe('Hello World');
  });
});

describe('contentSignals', () => {
  const html = '<h1>Security layer</h1><h2>Purchase Credits. Run Scans.</h2><h2>Pentest in your editor using MCP</h2><h2>FAQ</h2>';
  const text = 'Single scan $29. Pack of 5 for $99. Pack of 20 for $299.';

  it('finds sections that are present and the prices actually shown', () => {
    const s = contentSignals(html, text, 0);
    expect(s.sections.pricing).toBe(true);
    expect(s.sections.faq).toBe(true);
    expect(s.sections.howItWorks).toBe(false);
    expect(s.prices).toEqual(['$29', '$99', '$299']);
    expect(s.hasVisibleReviews).toBe(false);
    expect(s.multiLanguage).toBe(false);
  });

  it('recognises genuine review sections', () => {
    expect(contentSignals('<h2>What our customers say</h2>', '', 0).hasVisibleReviews).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// A crawl that mirrors the site in the brief.

function entity(over: Partial<SchemaEntity> & { type: string }): SchemaEntity {
  return { props: [], prices: [], stepNames: [], questions: [], hasRating: false, hasReview: false, ...over };
}

function crawl(over: Partial<CrawlResult> = {}): CrawlResult {
  const bots = ['GPTBot', 'ClaudeBot', 'CCBot', 'Bytespider'].map((name) => ({ name, role: 'training' as const, status: 403, blocked: true, robotsAllows: true }));
  const ok = ['OAI-SearchBot', 'Googlebot', 'ChatGPT-User'].map((name, i) => ({ name, role: (i === 2 ? 'assistant' : 'search') as 'assistant' | 'search', status: 200, blocked: false, robotsAllows: true }));
  return {
    rootUrl: 'https://site.test/',
    mode: 'SINGLE', depth: 1, timestamp: new Date().toISOString(),
    mainPage: {
      url: 'https://site.test/', loadTimeMs: 600, ttfbMs: 120, pageSizeKb: 40, status: 200,
      meta: { title: 'Security layer', description: 'Pentest every deploy', keywords: '', viewport: 'width=device-width', robots: '', canonical: 'https://site.test/' },
      headings: { h1: ['Security layer for every single deploy'], h2: ['Purchase Credits. Run Scans. Zero Lock-In.', 'Pentest in your editor using MCP', 'FAQ'], h3: [] },
      images: { total: 0, missingAlt: 0, list: [] },
      links: { total: 1, internal: 1, external: 0, list: [{ href: '/docs', type: 'internal', text: 'Docs' }] },
      structuredData: { hasJsonLd: true, types: ['SoftwareApplication', 'HowTo'] },
      lang: 'en', wordCount: 739,
      social: { ogTitle: 'x', ogDescription: 'x', ogImage: 'x', ogType: 'website', twitterCard: 'summary' }
    },
    additionalPages: [], sitemapFound: true, llmsTxtFound: true, hasSimulatedData: false,
    securityHeaders: { https: true, hsts: true, csp: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true },
    facts: {
      botAccess: { checkedUrl: 'https://site.test/', baselineStatus: 200, results: [...bots, ...ok], conflicts: bots.map((b) => b.name) },
      rawVsRendered: { rawStatus: 200, rawBytes: 10207, rawWords: 182, rawLinks: 4, rawSchemaTypes: ['SoftwareApplication', 'HowTo'], renderedWords: 739, renderedLinks: 1, renderedSchemaTypes: ['SoftwareApplication', 'HowTo', 'FAQPage'], schemaOnlyAfterJs: ['FAQPage'], navButtons: 6, navAnchors: 1 },
      schema: {
        entities: [
          entity({ type: 'SoftwareApplication', props: ['name', 'applicationCategory', 'operatingSystem', 'offers'], prices: [{ price: '29.00', currency: 'USD' }], version: '0.1.0' }),
          entity({ type: 'HowTo', props: ['name', 'totalTime', 'step'], totalTime: 'PT5M', stepNames: ['a', 'b', 'c', 'd'] }),
          entity({ type: 'Organization', props: ['name', 'url'] })
        ],
        invisible: [{ type: 'HowTo', items: ['Connect your repo'], total: 4 }]
      },
      signals: { sections: { pricing: true, faq: true, howItWorks: false, features: false, about: false, contact: false, reviews: false }, prices: ['$29', '$99', '$299'], hasVisibleReviews: false, multiLanguage: false }
    },
    ...over
  } as CrawlResult;
}

describe('contradiction (false positives from the brief)', () => {
  const c = crawl();
  it('a: schema properties that are already present', () => {
    expect(contradiction('add applicationcategory, operatingsystem and offers to the softwareapplication schema', c)).toMatch(/already has/);
    expect(contradiction('the howto schema lacks totaltime; add totaltime', c)).toMatch(/already has/);
  });
  it('b: invented prices, but not the real ones', () => {
    expect(contradiction('add offers to the schema with "price": "99"', c)).toMatch(/already declares the price/); // 99 is the 5-pack, the product is $29
    expect(contradiction('add offers markup with "price": "499" for the product schema', c)).toMatch(/price/);
    expect(contradiction('set the schema offer price to 29.00 usd', c)).toBeNull();
  });
  it('c: ratings with no genuine reviews', () => {
    expect(contradiction('add aggregaterating to the schema if available', c)).toMatch(/genuine reviews|invented/);
  });
  it('g: alt text on a page with no images', () => {
    expect(contradiction('add descriptive alt text to all images', c)).toMatch(/no images/);
  });
  it('h: hreflang on a single-language site', () => {
    expect(contradiction('add hreflang tags for language variants', c)).toMatch(/hreflang/);
  });
  it('f: sections the page already has', () => {
    expect(contradiction('add a pricing and credits section to the page', c)).toMatch(/already has a pricing/);
    expect(contradiction('add an mcp server integration section', c)).toMatch(/already has a section/);
  });
  it('keeps the valid findings from the brief', () => {
    expect(contradiction('add a how it works section explaining the steps', c)).toBeNull();
    expect(contradiction('add a direct-answer quick answers block near the top of the page', c)).toBeNull();
    expect(contradiction('llms.txt needs an attribution format and usage terms for citations', c)).toBeNull();
    expect(contradiction('add more internal links; navigation is not crawlable', c)).toBeNull();
  });
  it('does not drop schema work on a type that is genuinely absent', () => {
    expect(contradiction('add breadcrumblist schema with itemlistelement for the docs pages', c)).toBeNull();
    expect(contradiction('add organization schema with a logo', c)).toMatch(/already present/);
  });
});

describe('stripRichResultsAdvice (d)', () => {
  it('removes the Rich Results Test sentence for FAQ and HowTo but keeps the rest', () => {
    const out = stripRichResultsAdvice('Keep the FAQ answers concise. Validate HowTo and FAQPage with the Rich Results Test. Link them from the nav.');
    expect(out).not.toMatch(/rich results/i);
    expect(out).toMatch(/concise/);
    expect(out).toMatch(/Link them/);
  });
});

// ---------------------------------------------------------------------------------------------
// The whole report

function draft(): DeepSeekSeoReport {
  const fix = (title: string, description: string, remediation: string, category: any = 'content') => ({ title, category, priority: 'medium' as const, description, remediation });
  return {
    score: { overall: 86, technical: 92, content: 84, aeoGeo: 88, performance: 90 },
    executiveSummary: 'Solid site.',
    criticalIssues: ['Add aggregateRating to improve trust.'],
    recommendedFixes: [
      fix('Complete SoftwareApplication schema', 'The SoftwareApplication schema lacks applicationCategory, operatingSystem and offers; HowTo lacks totalTime.', 'Add applicationCategory, operatingSystem and offers to the SoftwareApplication JSON-LD.', 'technical'),
      fix('Add price to offers', 'Offers has no price in the schema.', 'Use "offers": price "99" in the structured data (adjust as needed).', 'technical'),
      fix('Add aggregateRating', 'Rating markup unlocks stars.', 'Add aggregateRating if available.', 'technical'),
      fix('Validate structured data', 'Check the markup.', 'Validate HowTo and FAQPage with Google\'s Rich Results Test.', 'technical'),
      fix('Add alt text', 'Images need alt text.', 'Add descriptive alt text to images.'),
      fix('Add hreflang', 'Multi-language support.', 'Add hreflang tags for each language.', 'technical'),
      fix('Add pricing and MCP sections', 'The page needs more sections.', 'Add a "Pricing and credits" section and an "MCP server integration" section.'),
      fix('Add a direct-answer block', 'No Quick answers near the top.', 'Add a Quick answers block with concise direct answers.', 'aeo-geo'),
      fix('Extend llms.txt', 'llms.txt has no attribution format or usage terms.', 'Add attribution and usage terms to llms.txt.', 'aeo-geo')
    ],
    aeoAssessment: { generativeFriendlinessScore: 88, directAnswerFriendliness: 'ok', richSnippetEligibility: ['FAQ', 'HowTo', 'SoftwareApplication'], voiceSearchOptimized: false, recommendationsForAeo: ['Test with the Rich Results Test for FAQPage.'] }
  };
}

describe('finalizeReport on the brief\'s scenario', () => {
  const out = finalizeReport(draft(), crawl());
  const titles = out.recommendedFixes.map((f) => f.title);

  it('removes every false positive and says why', () => {
    for (const gone of ['Complete SoftwareApplication schema', 'Add price to offers', 'Add aggregateRating', 'Validate structured data', 'Add alt text', 'Add hreflang', 'Add pricing and MCP sections']) {
      expect(titles).not.toContain(gone);
    }
    expect(out.qa!.removed.length).toBeGreaterThanOrEqual(7);
    expect(out.criticalIssues.join(' ')).not.toMatch(/aggregateRating/i);
  });

  it('keeps the findings that were right', () => {
    expect(titles).toContain('Add a direct-answer block');
    expect(titles).toContain('Extend llms.txt');
  });

  it('adds what the audit missed, from measurements', () => {
    expect(titles).toContain('Decide, and state, whether AI-training crawlers are welcome');
    expect(titles).toContain('Put the main content in the HTML the server sends');
    expect(titles).toContain('Serve structured data in the initial HTML');
    expect(titles).toContain('Make HowTo markup match the visible page');
    expect(titles).toContain('Use real links for navigation');
    const js = out.recommendedFixes.find((f) => f.title.startsWith('Put the main content'))!;
    expect(js.description).toMatch(/182 words/);
    expect(js.description).toMatch(/commonly reported/);
    expect(js.description).not.toMatch(/tested per crawler.*do/i);
  });

  it('treats training-crawler blocking as a policy decision, not a critical error', () => {
    const f = out.recommendedFixes.find((x) => x.title.startsWith('Decide, and state'))!;
    expect(f.priority).toBe('low');
    expect(f.description).toMatch(/site owner's choice/);
    expect(out.criticalIssues.join(' ')).not.toMatch(/GPTBot/);
  });

  it('computes the scores instead of trusting the model, and explains them', () => {
    expect(out.scoreMethod).toBe('measured');
    expect(out.score.aeoGeo).toBeLessThan(88);
    expect(out.scoreBreakdown!.aeoGeo.some((d) => /without JavaScript|JavaScript/.test(d.reason))).toBe(true);
    expect(out.aeoAssessment.generativeFriendlinessScore).toBe(out.score.aeoGeo);
  });

  it('no longer advertises FAQ/HowTo rich results and explains the markup is still valid', () => {
    expect(out.aeoAssessment.richSnippetEligibility).toEqual(['SoftwareApplication']);
    const recs = out.aeoAssessment.recommendationsForAeo.join(' ');
    expect(recs).not.toMatch(/Test with the Rich Results Test/);
    expect(recs).toMatch(/no rich result to validate/);
  });

  it('rebuilds the hand-off prompt from the checked report so it cannot repeat removed advice', () => {
    const prompt = out.agentReadyPrompt!.prompt;
    expect(prompt).not.toMatch(/aggregateRating/i);
    expect(prompt).not.toMatch(/hreflang/i);
    expect(prompt).toMatch(/Decide, and state/);
  });
});

describe('search crawlers blocked', () => {
  it('is a high-priority critical issue and costs more than blocked training crawlers', () => {
    const c = crawl();
    c.facts!.botAccess!.results.push({ name: 'PerplexityBot', role: 'search', status: 403, blocked: true, robotsAllows: true });
    const out = finalizeReport(draft(), c);
    expect(out.criticalIssues[0]).toMatch(/PerplexityBot/);
    expect(out.recommendedFixes[0].priority).toBe('high');
    expect(computeScores(c).score.aeoGeo).toBeLessThan(computeScores(crawl()).score.aeoGeo);
  });
});

describe('computeScores', () => {
  it('is deterministic: the same crawl always scores the same', () => {
    expect(computeScores(crawl())).toEqual(computeScores(crawl()));
  });

  it('does not penalise alt text on a page with no images, or hreflang on a one-language page', () => {
    const { breakdown } = computeScores(crawl());
    expect(breakdown.content.some((d) => /alt/.test(d.reason))).toBe(false);
  });

  it('penalises measured problems and lists them', () => {
    const bad = crawl({ robotsBlocksAll: true, sitemapFound: false });
    const { score, breakdown } = computeScores(bad);
    expect(breakdown.technical.map((d) => d.reason).join(' ')).toMatch(/robots\.txt disallows/);
    expect(score.technical).toBeLessThan(computeScores(crawl()).score.technical);
  });

  it('leaves illustrative (simulated) reports alone', () => {
    const sim = crawl({ hasSimulatedData: true });
    const out = finalizeReport(draft(), sim);
    expect(out.scoreMethod).toBe('illustrative');
    expect(out.score.overall).toBe(86);
  });
});

vi.mock('../../lib/ssrfGuard', () => ({
  safeFetch: vi.fn(async (_url: string, opts: { headers?: Record<string, string> }) => {
    const ua = opts.headers?.['User-Agent'] ?? '';
    const blocked = /GPTBot|ClaudeBot|CCBot|Bytespider/.test(ua);
    return { status: blocked ? 403 : 200, ok: !blocked, headers: {}, url: 'https://site.test/', text: '' };
  })
}));

describe('checkBotAccess', () => {
  it('requests the page as each crawler and reports blocks and robots conflicts', async () => {
    const { checkBotAccess, BOTS } = await import('../../lib/audit/botAccess');
    const events: string[] = [];
    const res = await checkBotAccess('https://site.test', 'User-agent: *\nAllow: /', 200, (_s, _l, m) => { events.push(m); });
    expect(BOTS).toHaveLength(13);
    expect(res.results).toHaveLength(13);
    expect(res.results.filter((r) => r.blocked).map((r) => r.name).sort()).toEqual(['Bytespider', 'CCBot', 'ClaudeBot', 'GPTBot']);
    expect(res.results.find((r) => r.name === 'Googlebot')!.blocked).toBe(false);
    expect(res.conflicts.sort()).toEqual(['Bytespider', 'CCBot', 'ClaudeBot', 'GPTBot']);
    expect(events.join('\n')).toMatch(/robots\.txt allows but the site refuses/);
  });

  it('does not report a conflict when robots.txt itself disallows the crawler', async () => {
    const { checkBotAccess } = await import('../../lib/audit/botAccess');
    const res = await checkBotAccess('https://site.test', 'User-agent: GPTBot\nDisallow: /\n', 200, () => {});
    expect(res.conflicts).not.toContain('GPTBot');
    expect(res.conflicts).toContain('ClaudeBot');
  });
});

// Bugs found by running the checker against a real site: it must not drop legitimate advice.
describe('regressions from a real scan', () => {
  const c = crawl();
  it('keeps a fix that asks for properties the entity does not have, even if it mentions ones it does', () => {
    expect(contradiction('strengthen the organization entity with sameas and logo consistency (name and url already match) in the json-ld schema', c)).toBeNull();
    expect(contradiction('add a contact point to the organization schema', c)).toBeNull();
  });
  it('still drops a fix when everything it asks for already exists', () => {
    expect(contradiction('the softwareapplication schema lacks applicationcategory and operatingsystem; add them', c)).toMatch(/already has/);
  });
  it('does not treat cautionary wording as a request', () => {
    expect(contradiction('do not add aggregaterating or review markup unless genuine reviews are shown on the page', c)).toBeNull();
    expect(contradiction('only add review schema if real customer reviews are visible', c)).toBeNull();
  });
  it('does not match a section just because its word appears in unrelated advice', () => {
    expect(contradiction('keep the raw-html-first rendering advantage intact so pricing and content stay crawlable', c)).toBeNull();
    expect(contradiction('resolve the duplicate softwareapplication and offer entities in the json-ld schema', c)).toBeNull();
  });
});

describe('tier pricing and dedupe regressions', () => {
  it('allows advice about plan tiers to use any price the page shows, but not a single-price swap', () => {
    const c = crawl();
    c.facts!.schema!.entities[0].prices = [{ price: '0', currency: 'USD' }];
    expect(contradiction('strengthen the softwareapplication schema with the pricing tiers already on the page: add offers for the 99 usd pack', c)).toBeNull();
    expect(contradiction('set the schema offers price to 99 usd', c)).toMatch(/already declares the price/);
  });
  it('does not treat an unrelated fix that merely mentions the edge as a bot-blocking duplicate', () => {
    const c = crawl();
    const d = draft();
    d.recommendedFixes.push({ title: 'Keep the current security-header posture', category: 'technical', priority: 'low', description: 'Headers are good; re-verify after any edge or CDN change.', remediation: 'Re-run the audit after changing edge rules, bot protection or caching.' });
    const out = finalizeReport(d, c);
    expect(out.recommendedFixes.map((f) => f.title)).toContain('Keep the current security-header posture');
  });
  it('replaces the AI-written "render the HowTo or remove the markup" with the measured finding', () => {
    const d = draft();
    d.recommendedFixes.push({ title: 'Render the HowTo steps visibly or remove the HowTo markup', category: 'technical', priority: 'medium', description: 'The HowTo steps are not visible on the page.', remediation: 'Show the steps on the page or remove the markup.' });
    const out = finalizeReport(d, crawl());
    const howto = out.recommendedFixes.filter((f) => /howto/i.test(f.title));
    expect(howto).toHaveLength(1);
    expect(howto[0].title).toBe('Make HowTo markup match the visible page');
  });
});

describe('dedupe is judged by the fix title', () => {
  it('keeps a raw-HTML fix that merely mentions FAQPage and rendering in its body', () => {
    const c = crawl();
    c.facts!.schema!.invisible = [{ type: 'FAQPage', items: ['q'], total: 2 }];
    const d = draft();
    d.recommendedFixes.push({ title: 'Ensure critical content and links are present in raw HTML', category: 'aeo-geo', priority: 'medium', description: 'FAQPage and navigation are rendered by script; the visible text differs from raw.', remediation: 'Server-render the content.' });
    d.recommendedFixes.push({ title: 'Align FAQ structured data with visible content', category: 'technical', priority: 'medium', description: 'FAQ answers are not visible.', remediation: 'Show them.' });
    const titles = finalizeReport(d, c).recommendedFixes.map((f) => f.title);
    expect(titles).toContain('Ensure critical content and links are present in raw HTML');
    expect(titles).not.toContain('Align FAQ structured data with visible content');
  });
});

describe('named sections', () => {
  it('keeps a request for a standard section the page was measured as lacking, even if the word appears elsewhere', () => {
    const c = crawl();
    c.mainPage.headings.h2.push('Everything you need to know about scanning');
    expect(contradiction('add a contact or about section to satisfy entity trust signals', c)).toBeNull();
  });
});

describe('measurement details', () => {
  it('reads "$29," in running text as $29', () => {
    expect(contentSignals('<h2>Pricing</h2>', 'Single scan $29, five scans $99. Twenty for $1,299.50.', 0).prices).toEqual(['$29', '$99', '$1,299.50']);
  });
  it('treats a paraphrased step as visible but a genuinely missing one as not', () => {
    const entities = [entity({ type: 'HowTo', stepNames: ['Prove domain ownership to unlock active exploit probes', 'Teleport the database to mars'] })];
    const visible = 'First verify your domain ownership. This unlocks the active probes that exploit weaknesses.';
    const inv = invisibleSchemaItems(entities, visible);
    expect(inv).toHaveLength(1);
    expect(inv[0].items).toEqual(['Teleport the database to mars']);
  });
});

describe('found by auditing SEO Scan Pro with itself', () => {
  it('does not count headings inside <noscript> as part of the page', async () => {
    const { parsePage } = await import('../../lib/crawler');
    const html = '<html><head><title>T</title></head><body><div id="root"><h1>Real heading</h1></div><noscript><h1>Fallback heading</h1><a href="/x">x</a></noscript></body></html>';
    const page = parsePage('https://x.test/', html, 100);
    expect(page.headings.h1).toEqual(['Real heading']);
  });

  it('recognises a "How it works" navigation link as that section existing', () => {
    const html = '<nav><a href="#features">Features</a><a href="#how">How it works</a></nav><h2>Thirteen stages. Every one visible.</h2>';
    expect(contentSignals(html, '', 0).sections.howItWorks).toBe(true);
    expect(contentSignals('<nav><a href="#features">Features</a></nav><h2>Pricing</h2>', '', 0).sections.howItWorks).toBe(false);
  });
});

describe('severity calibration', () => {
  const fix = (title: string, priority: 'high' | 'medium' | 'low', description: string) => ({ title, category: 'performance' as const, priority, description, remediation: 'Do it.' });

  it('downgrades TTFB/LCP findings to medium when the time is mostly network distance, and says so', () => {
    const c = crawl();
    c.mainPage.ttfbMs = 3500; c.mainPage.loadTimeMs = 3900;
    const d = draft();
    d.recommendedFixes.push(fix('Reduce server response time (TTFB)', 'high', 'TTFB is 3500 ms.'));
    d.recommendedFixes.push(fix('Improve Largest Contentful Paint', 'high', 'LCP is 4900 ms.'));
    const out = finalizeReport(d, c);
    const ttfb = out.recommendedFixes.find((f) => f.title.startsWith('Reduce server response'))!;
    expect(ttfb.priority).toBe('medium');
    expect(ttfb.description).toMatch(/scanning host/);
    expect(out.recommendedFixes.find((f) => f.title.startsWith('Improve Largest'))!.priority).toBe('medium');
  });

  it('leaves performance priorities alone when the server itself is slow relative to the rest', () => {
    const c = crawl();
    c.mainPage.ttfbMs = 200; c.mainPage.loadTimeMs = 3900;
    const d = draft();
    d.recommendedFixes.push(fix('Reduce server response time (TTFB)', 'high', 'TTFB is 200 ms.'));
    expect(finalizeReport(d, c).recommendedFixes.find((f) => f.title.startsWith('Reduce server response'))!.priority).toBe('high');
  });

  it('reports a moderate JavaScript gap as medium, not critical', () => {
    const c = crawl();
    c.facts!.rawVsRendered!.rawWords = 664; c.facts!.rawVsRendered!.renderedWords = 1208; c.facts!.rawVsRendered!.schemaOnlyAfterJs = [];
    const d = draft();
    d.criticalIssues.push('Severe JavaScript dependency: raw HTML has 664 words but the rendered page has 1208.');
    d.recommendedFixes.push({ title: 'Eliminate JavaScript dependency for core content', category: 'aeo-geo', priority: 'high', description: 'Render on the server.', remediation: 'Server-side render the page.' });
    const out = finalizeReport(d, c);
    expect(out.criticalIssues.join(' ')).not.toMatch(/Severe JavaScript/);
    expect(out.recommendedFixes.find((f) => f.title.startsWith('Eliminate JavaScript'))!.priority).toBe('medium');
  });

  it('does not demote a navigation-buttons critical issue with the JavaScript-gap reason', () => {
    const c = crawl();
    c.facts!.rawVsRendered!.rawWords = 664; c.facts!.rawVsRendered!.renderedWords = 1208; c.facts!.rawVsRendered!.schemaOnlyAfterJs = [];
    const d = draft();
    d.criticalIssues.push('Navigation is built from buttons, not anchors; the raw HTML exposes few links.');
    const out = finalizeReport(d, c);
    // A-13: not a measured severe condition, so it is calibrated down to a fix rather than dropped by the JS rule.
    expect(out.recommendedFixes.map((f) => f.title).join(' ')).toMatch(/Navigation is built from buttons|real links/);
  });

  it('keeps the severe case critical when the raw HTML is nearly empty', () => {
    const out = finalizeReport(draft(), crawl()); // 182 raw vs 739 rendered words
    expect(out.recommendedFixes.some((f) => f.title.startsWith('Put the main content'))).toBe(true);
  });
});
