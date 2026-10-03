import type { CrawlResult } from '../../src/types';
import { navButtonsMatter } from './scoring';

// Decides whether one written recommendation is contradicted by the measured evidence. It is
// deliberately conservative: a suggestion is dropped only when it clearly asks for something the
// page already has or must not do, never merely because it mentions a word that appears on the page.

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'your', 'our', 'dedicated', 'visible', 'clear', 'new', 'page', 'section', 'block', 'heading', 'main', 'key']);
const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

const esc = (s: string) => s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
const word = (s: string) => new RegExp(`\\b${esc(s)}\\b`, 'i');

/** Verbs that ask for something to be added or point out that it is absent. */
const ASK = '(?:add|adding|create|include|introduce|publish|build|implement|provide|declare|specify|set|missing|lacks?|lacking|absent|no|without)';

/** Cautionary wording ("do not add review markup unless…") is guidance, not a request. */
const NEGATION = /\b(do not|don't|dont|never|avoid|unless|only if|only when|only add|if (?:real|genuine|actual|you have)|rather than|instead of|not to|must not|should not)\b/;

// Schema.org properties specific enough that mentioning one means "this should be on the entity".
// Generic ones (name, url, description, image) are left out: they appear in text incidentally.
const REQUESTABLE = ['applicationCategory', 'operatingSystem', 'offers', 'totalTime', 'aggregateRating', 'review', 'sameAs', 'logo', 'contactPoint', 'address', 'author', 'publisher', 'softwareVersion', 'datePublished', 'dateModified', 'mainEntity', 'step', 'price', 'priceCurrency', 'availability', 'brand'];

// schema.org subtypes of Organization: a site declaring one of these HAS Organization markup.
const ORG_SUBTYPES = new Set(['Corporation', 'LocalBusiness', 'NGO', 'EducationalOrganization', 'CollegeOrUniversity', 'School', 'GovernmentOrganization', 'OnlineStore', 'Store', 'NewsMediaOrganization', 'MedicalOrganization', 'SportsOrganization', 'PerformingGroup', 'Airline', 'Restaurant', 'Hotel', 'OnlineBusiness', 'LibrarySystem']);

const SECTION_TERMS: Record<string, string[]> = {
  pricing: ['pricing', 'plans', 'credits'],
  faq: ['faq', 'frequently asked questions'],
  howItWorks: ['how it works'],
  features: ['what we test', 'features', 'capabilities'],
  about: ['about'],
  contact: ['contact']
};

function asks(text: string, term: string): boolean {
  const t = esc(term);
  return new RegExp(`\\b${ASK}\\b[^.;]{0,40}\\b${t}\\b`, 'i').test(text) || new RegExp(`\\b${t}\\b[^.;]{0,30}\\b(?:is|are)\\s+(?:missing|absent|not (?:present|set|declared))`, 'i').test(text);
}

/**
 * The text asks for a single tag/element to EXIST ("add an H1", "missing viewport tag"): the term
 * must follow the verb directly. Looser matching ("add your keyword to the H1", "no overlap between
 * the title and h1") describes changing or judging an element that is already there.
 */
function asksToCreate(text: string, term: string): boolean {
  const t = esc(term);
  const mod = '(?:(?:main|primary|visible|valid|proper|clear|single|meta|html)\\s+){0,2}';
  return new RegExp(`\\b${ASK}\\s+(?:an?\\s+|the\\s+|your\\s+)?${mod}${t}\\b`, 'i').test(text)
    || new RegExp(`\\b${t}\\b[^.;]{0,30}\\b(?:is|are)\\s+(?:missing|absent|not (?:present|set|declared))`, 'i').test(text);
}

/** The element is wanted on OTHER pages or templates, so its presence on the audited page is irrelevant. */
const ELSEWHERE = /paginat|templates?\b|\bblog\b|categor(?:y|ies)|archives?\b|product pages?|other pages|subpages?|inner pages|additional pages|each page|every page|all pages|across (?:the )?(?:site|pages)|landing pages|article pages/;

/** Words that mean "change/improve what is there", not "add what is missing". */
const MODIFIES = /keyword|generic|vague|rewrite|reword|improve|descriptive|specific|clearer|weak|overlap|mismatch|match\b|too (?:short|long|generic)|length|unique|duplicate|stuff|optimi[sz]|initial-scale|maximum-scale|user-scalable|zoom|width=|remove|replace|correct|incorrect|wrong|self-referenc|point(?:s|ing)? to|http:|trailing slash|query/;

/** Reason the recommendation contradicts the evidence, or null when it stands. `text` is lowercased title + description + remediation. */
export function contradiction(text: string, crawl: CrawlResult): string | null {
  const page = crawl.mainPage;
  const facts = crawl.facts;
  const signals = facts?.signals;
  const rvr = facts?.rawVsRendered;
  const entities = facts?.schema?.entities ?? [];
  const aboutSchema = /schema|structured data|json-?ld|markup/.test(text);
  const headingPool = [...page.headings.h1, ...page.headings.h2, ...page.headings.h3].join(' ').toLowerCase();
  const pool = `${headingPool} ${page.links.list.map((l) => l.text).join(' ').toLowerCase()}`;
  // Pricing tiers, packs and extra offers: adding offers beside one that already exists is legitimate.
  const aboutTiers = /\b(tiers?|plans?|packs?|bundles?|additional offers?|each (?:plan|offer)|multiple offers|pricing (?:already )?(?:shown|on the page))\b/.test(text);

  // Alt text on a page with no images.
  if (page.images.total === 0 && /\balt[ -]?(text|attributes?|tags?)\b|\balt=|missing alt|image alt/.test(text)) {
    return 'the page has no images, so there is no alt text to fix';
  }

  // alt="" is valid (decorative). A claim that N images "have no alt attribute" may not include them.
  const noAlt = page.images.noAltAttribute;
  if (noAlt !== undefined && page.images.total > 0) {
    const claim = /(\d+)\s+(?:of\s+(?:the\s+)?\d+\s+)?(?:images?|img)\b[^.;]{0,40}?(?:no alt|without (?:an? )?alt|missing (?:an? )?alt|lack(?:s|ing)? (?:an? )?alt|alt (?:text|attributes?) (?:is|are) missing)/.exec(text);
    const generic = /(?:missing|no|lack\w*|without)\s+(?:an?\s+)?alt\b|images? (?:are )?missing alt|alt[ -]?(?:text|attributes?)\s+(?:is|are)?\s*missing/.test(text);
    const decorativeAware = /empty alt|alt=""|decorative/.test(text);
    if (claim && Number(claim[1]) > noAlt) {
      return `${claim[1]} images are said to have no alt attribute, but only ${noAlt} do (the rest have alt="", which marks a decorative image and is valid)`;
    }
    if (noAlt === 0 && generic && !decorativeAware) {
      return 'every image has an alt attribute (empty alt="" marks a decorative image and is valid), so there is no missing alt text to fix';
    }
  }

  // robots.txt / sitemap / llms.txt that could not be READ are unknown, not absent.
  const absentClaim = (term: string) =>
    asks(text, term) || new RegExp(`\\b${esc(term)}\\b[^.;]{0,40}\\b(?:not found|not present|does not exist|doesn't exist|could not be found|unavailable|returns? (?:a )?404)\\b`, 'i').test(text) || new RegExp(`\\b(?:not found|no|404)\\b[^.;]{0,20}\\b${esc(term)}\\b`, 'i').test(text);
  if (crawl.sitemapChecked === false && /sitemap/.test(text) && absentClaim('sitemap')) return 'the sitemap request was refused or failed, so whether one exists is unknown (it was not found missing)';
  if (crawl.llmsChecked === false && /llms\.txt/.test(text) && absentClaim('llms.txt')) return 'the llms.txt request was refused or failed, so whether one exists is unknown (it was not found missing)';
  if (crawl.robotsReadable === false && /robots\.txt/.test(text) && (absentClaim('robots.txt') || /no (?:rules|directives)|no (?:explicit )?(?:crawler|bot) rules|(?:does not|doesn't) (?:explicitly )?(?:mention|list|address)/.test(text))) {
    return 'robots.txt could not be read (the request was refused or failed), so nothing can be said about what it contains';
  }

  // A crawler that robots.txt explicitly disallows: the claim that robots.txt is silent about it is false.
  for (const r of facts?.botAccess?.results ?? []) {
    if (!(r.robotsAllows === false || crawl.robotsByCrawler?.[r.name] === 'disallowed') || !text.includes(r.name.toLowerCase())) continue;
    if (/(?:does not|doesn't|not)\s+(?:explicitly|clearly)\s+(?:allow|disallow|mention|address|list|state|declare|specify|restrict)|(?:does not|doesn't)\s+(?:mention|address|list|state|declare|specify|restrict)|no (?:explicit )?(?:rule|directive|policy)|ambiguous|unclear|contradict/.test(text)) {
      return `robots.txt explicitly disallows ${r.name}, so its policy is stated and a refusal is consistent with it`;
    }
  }

  // Claims about a lead answer / definition / summary need the opening text the model was shown.
  if (!signals?.openingText) {
    const lead = '(?:direct answers?|concise (?:definition|answers?|summary)|definition block|(?:clear |brief |short )?definition|lead summary|summary (?:block|paragraph|sentence)|tl;?dr|answer[- ]first)';
    const absent = new RegExp(`\\b(?:no|lacks?|lacking|missing|without|absent|not (?:have|provide|include|offer|open with))\\b[^.;]{0,50}\\b${lead}`, 'i');
    // Only assertions of absence are dropped; "add a direct-answer block" is a recommendation, not a claim about the page.
    if (absent.test(text) && !NEGATION.test(text)) return 'the opening text of the page was not provided as evidence, so whether it contains a direct answer, definition or summary cannot be judged';
  }

  // Advice to allow a crawler that robots.txt explicitly disallows, or a claim that robots.txt allows it.
  for (const r of facts?.botAccess?.results ?? []) {
    if (!(r.robotsAllows === false || crawl.robotsByCrawler?.[r.name] === 'disallowed') || !text.includes(r.name.toLowerCase())) continue;
    const n = esc(r.name.toLowerCase());
    const advisesAllow = new RegExp(`\\b(?:add|set|create|publish|include|declare)\\b[^.;]{0,30}\\ballow\\b|\\b(?:allow|permit|welcome|unblock)\\b[^.;]{0,60}\\b${n}\\b|\\b${n}\\b[^.;]{0,40}\\b(?:be allowed|to be allowed|explicitly allowed)\\b|\\brobots\\.txt\\s+(?:allows|permits|welcomes)\\b[^.;]{0,60}\\b${n}\\b`, 'i').test(text);
    if (advisesAllow && !NEGATION.test(text)) return `robots.txt explicitly disallows ${r.name}: advising to allow it, or saying robots.txt allows it, contradicts the site's stated policy`;
  }

  // The site opted out of AI training (Content-Signal: ai-train=no): do not praise training access.
  if (signals?.contentSignal?.aiTrain === false && /(?:optimal|ideal|welcome|well[- ]positioned|open|permissive|good|great|excellent)[^.;]{0,60}\b(?:ai[- ]training|training crawlers?|for training)\b|\ballows? (?:ai[- ])?training\b/.test(text) && !NEGATION.test(text)) {
    return 'robots.txt declares Content-Signal ai-train=no, so the site opts out of AI training';
  }

  // A site with language-switcher links is not single-language.
  if (signals?.multiLanguage && /single[- ]language|one language|monolingual|only one language/.test(text)) {
    return 'the page links to several language versions, so it is not single-language';
  }

  // Retired or unsupported Google features must not be suggested as benefits.
  if (/sitelinks? search ?box/.test(text)) return 'the sitelinks search box was retired by Google in 2024';
  if (/(?:eligib|qualif|earn|unlock|trigger|appear|show|display|gain)[^.;]{0,50}\b(?:faq|how-?to) (?:rich )?(?:results?|snippets?)/.test(text) && !NEGATION.test(text)) {
    return 'FAQ and HowTo rich results are no longer shown for ordinary sites, so they cannot be offered as a benefit';
  }

  // Organization subtypes count as Organization.
  const have = new Set(entities.map((e) => e.type));
  if (Array.from(have).some((t) => ORG_SUBTYPES.has(t)) && /\b(?:add|create|implement|publish|include|missing|no|lacks?|without)\b[^.;]{0,30}\borganization\b[^.;]{0,20}(?:schema|markup|structured data|json-ld)/.test(text)) {
    return `an Organization subtype (${Array.from(have).filter((t) => ORG_SUBTYPES.has(t)).join(', ')}) is already declared`;
  }

  // Customer stories exist: "no testimonials / case studies" is wrong.
  if (signals?.customerStories && /\b(?:add|include|create|missing|lacks?|lacking|no|without|absence of)\b[^.;]{0,40}\b(?:testimonials?|case stud(?:y|ies)|customer stories|social proof)\b/.test(text) && !NEGATION.test(text)) {
    return 'the page already shows customer stories, case studies or testimonials';
  }

  // FAQPage only describes visible questions and answers; BreadcrumbList has no value on a homepage.
  if (/\bfaqpage\b|faq (?:schema|markup|structured data)/.test(text) && /\b(?:add|implement|create|publish|include)\b/.test(text) && signals && !signals.sections.faq && !entities.some((e) => e.type === 'FAQPage')
      && !(page.headings.h2.concat(page.headings.h3).some((h) => h.trim().endsWith('?')))) {
    return 'the page has no visible question-and-answer content, so FAQPage markup would not describe anything on the page';
  }
  if (/breadcrumb/.test(text) && /\b(?:add|implement|create|publish|include|missing|no|lacks?)\b/.test(text) && /\bhome(?: ?page)?\b|root page|landing page|front page/.test(text)) {
    let path = '/';
    try { path = new URL(crawl.rootUrl).pathname; } catch { /* keep */ }
    if (/^\/(?:[a-z]{2}(?:-[a-z]{2,4})?\/?)?$/i.test(path)) return 'a homepage has no breadcrumb trail to mark up';
  }

  // The no-JavaScript comparison was a bot wall or an unreliable response: its figures are not facts.
  if (rvr && (rvr.rawChallenge || rvr.rawFetchUnreliable) && /(?:without|no|disabled|off) javascript|raw html|server-?sent|javascript[- ](?:dependen|only)|client-side render|server-?side render|pre-?render/.test(text)) {
    return 'the no-JavaScript response was a bot wall or unreliable, so raw word, link and schema figures cannot be compared with the rendered page';
  }

  // Navigation "buttons": only a problem when real links are missing from the HTML the server sends.
  if (rvr && /(?:nav(?:igation)?|menu|footer|header)[^.;]{0,30}\bbuttons?\b|\bbuttons?\b[^.;]{0,30}(?:nav(?:igation)?|menu)/.test(text) && !navButtonsMatter(rvr)) {
    return `the navigation has real links (${rvr.navAnchors} anchors; ${rvr.rawLinks} links in the server HTML vs ${rvr.renderedLinks} rendered), so the buttons (language, search, cookie, menu toggles) do not hide it from crawlers`;
  }

  // HTTP 999 (and 401/403/429) from a link check is a bot wall, not a broken link.
  if (/\bbroken\b/.test(text) && /\b(?:999|status 999|http 999)\b/.test(text)) return 'HTTP 999 is an anti-bot response, so the link was not verified broken';

  // robots.txt that could not be read: nothing may be said about what it allows or disallows.
  if ((crawl.robotsReadable === false || facts?.botAccess?.unreadableRobots) && /robots\.txt\s+(?:\w+\s+)?(?:allows|permits|welcomes|disallows|blocks|prohibits|forbids)\b/.test(text)) {
    return 'robots.txt could not be read, so nothing can be said about what it allows or disallows';
  }

  // Report-only CSP is a policy, not an absence.
  if (crawl.securityHeaders?.cspReportOnly && /content-security-policy|\bcsp\b/.test(text) && /\b(?:add|missing|no|lacks?|without|absent|start with|implement|set)\b/.test(text) && !/enforc/.test(text)) {
    return 'the site already sends Content-Security-Policy-Report-Only';
  }

  // Redirects: a hop count that is not the measured one, or a location-based redirect called a defect.
  if (crawl.redirectChain && /redirect/.test(text)) {
    const hops = crawl.redirectHops ?? crawl.redirectChain.length - 1;
    const words: Record<string, number> = { one: 1, single: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const m = /\b([1-9]|one|single|two|three|four|five|six)[- ](?:redirect[- ])?(?:hops?|redirects?)\b/.exec(text);
    if (m) {
      const said = words[m[1]] ?? Number(m[1]);
      if (said !== hops) return `the redirect count is wrong: the scan measured ${hops} redirect${hops === 1 ? '' : 's'}, not ${said}`;
    }
    if (crawl.redirectChain.some((u) => /^https?:\/\/geo\.|\/area\/|[?&](?:lang|locale|country)=/i.test(u))) return 'the redirect depends on the visitor\'s location or language by design, so it is not a defect';
  }

  // Statements about what the retired "not a defect" padding says of itself.
  // Also "no change is required", "already correct" and "keep it tidy": a fix that says the thing is
  // fine is a confirmation, not a recommendation.
  const NO_ACTION = /\b(?:this is )?not (?:really )?(?:a|an) (?:defect|problem|issue)\b|no (?:action|change|changes|fix|update)s? (?:is |are )?(?:needed|required|necessary)|nothing to (?:fix|change)|(?:is|are) already (?:correct|in place|configured correctly|valid)|simply confirm|just confirm/g;
  if (NO_ACTION.test(text)) {
    // A fix that asks for something AND says some other part needs no change is still a fix.
    const rest = text.replace(NO_ACTION, ' ');
    if (!/\b(?:add|create|include|implement|publish|set|replace|remove|update|fix|rewrite|change|enable|configure|serve|move|reduce|compress|declare|use|ensure|make|put|switch|install|link|redirect)\b/.test(rest)) {
      return 'the suggestion itself says there is nothing to fix';
    }
  }

  // hreflang on a single-language site.
  if (/hreflang/.test(text) && !(page.hreflang && page.hreflang.length) && !signals?.multiLanguage) {
    return 'no alternate-language versions were found, so hreflang does not apply';
  }

  // Ratings and reviews that do not exist (a warning not to add them is fine).
  if (/aggregate ?rating|review (markup|schema|snippet|rich)|star ratings?|add reviews?\b/.test(text) && !signals?.hasVisibleReviews && !NEGATION.test(text)) {
    return 'no genuine reviews are visible on the page; rating or review markup would be invented and breaks Google policy';
  }

  if (aboutSchema) {
    // Properties the entity already carries: drop only if EVERYTHING the fix asks to add is already there.
    const mentioned = entities.filter((e) => word(e.type).test(text));
    if (mentioned.length) {
      const have = new Set(mentioned.flatMap((e) => e.props.map((p) => p.toLowerCase())));
      const requested = REQUESTABLE.filter((p) => word(p).test(text) && asks(text, p) && !(aboutTiers && ['offers', 'price', 'priceCurrency'].includes(p)));
      if (requested.length && requested.every((p) => have.has(p.toLowerCase()))) {
        return `the ${Array.from(new Set(mentioned.map((e) => e.type))).join('/')} markup already has ${requested.join(', ')}`;
      }
    }
    // A whole schema type that is already declared ("add Organization schema").
    for (const type of new Set(entities.map((e) => e.type))) {
      const t = esc(type);
      const add = new RegExp(`\\b(?:add|create|implement|publish|include)\\s+(?:an?\\s+|the\\s+)?(?:valid\\s+|json-ld\\s+)?${t}\\s+(?:schema|markup|structured data|json-ld|entity|block)`, 'i');
      const missing = new RegExp(`\\b(?:missing|no|lacks?|without)\\s+(?:an?\\s+)?${t}\\s+(?:schema|markup|structured data|json-ld)`, 'i');
      if (add.test(text) || missing.test(text)) return `${type} structured data is already present`;
    }
  }

  // Invented prices. If the markup declares a price, that is the price; otherwise only a price
  // the page itself shows may be mentioned.
  if (/\bprice\b|\boffers?\b|\$\s?\d/.test(text) && aboutSchema) {
    const norm = (n: string) => String(Number(n.replace(/[$,]/g, '')));
    const declared = new Set<string>();
    for (const e of entities) for (const o of e.prices) declared.add(norm(o.price));
    const shown = new Set((signals?.prices ?? []).map(norm));
    // Advice about tiers or plans may use any price the page shows; a suggestion to set the price
    // of an offer that is already declared must match what is declared.
    const known = aboutTiers ? new Set([...declared, ...shown]) : declared.size ? declared : shown;
    // "$99", "price: 99", "price to/of/at 99", and "99 usd / dollars".
    const mentioned = [
      ...Array.from(text.matchAll(/(?:\$|usd\s?|price["']?\s*[:=]?\s*["']?)\s*(\d+(?:\.\d+)?)/g)),
      ...Array.from(text.matchAll(/\bprice\s+(?:of|to|as|at|is)\s+\$?(\d+(?:\.\d+)?)/g)),
      ...Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(?:usd|dollars?)\b/g))
    ].map((m) => norm(m[1]));
    const unknown = mentioned.filter((n) => !known.has(n));
    if (unknown.length) {
      return declared.size
        ? `the markup already declares the price (${Array.from(declared).join(', ')}); ${unknown[0]} is not what the site charges`
        : `it suggests a price (${unknown[0]}) the site does not show; prices must be read from the page`;
    }
  }

  // Sections the page visibly has.
  if (signals && !NEGATION.test(text)) {
    for (const [key, terms] of Object.entries(SECTION_TERMS)) {
      if (!(signals.sections as Record<string, boolean>)[key]) continue;
      for (const term of terms) {
        const t = esc(term);
        // "about"/"contact" are ordinary words ("guide AI models about ..."): they name a section only
        // when directly followed by section/page, and never when the suggestion is about another artefact.
        const bare = key === 'about' || key === 'contact';
        if (bare && /llms\.txt|sitemap|schema|json-?ld|robots\.txt|structured data|meta description|canonical/.test(text)) continue;
        const asksForSection = new RegExp(bare
          ? `\\b${ASK}\\b[^.;]{0,40}\\b${t}(?:\\s+us)?\\s+(?:section|page|block|heading)\\b`
          : `\\b${ASK}\\b[^.;]{0,40}\\b${t}\\b[^.;]{0,30}\\b(?:section|page|block|heading|content)\\b`, 'i').test(text);
        if (asksForSection) return `the page already has a ${key === 'howItWorks' ? '"how it works"' : key} section`;
      }
    }
    // A named section ("add an MCP server integration section"), checked against the page's headings and labels.
    const named = Array.from(text.matchAll(/(?:add|create|include|introduce|publish|build)\s+(?:a|an|the|dedicated)?\s*["'“]?([a-z0-9&/ -]{3,50}?)["'”]?\s+(?:section|block|heading)/g));
    for (const m of named) {
      const tokens = words(m[1]);
      if (!tokens.length) continue;
      // If the phrase names a standard section the page was measured as lacking, the request stands.
      const phrase = m[1];
      const namesMissingSection = Object.entries(SECTION_TERMS).some(([key, terms]) => !(signals.sections as Record<string, boolean>)[key] && terms.some((t) => word(t).test(phrase)));
      if (namesMissingSection) continue;
      const inPool = (t: string) => word(t).test(pool);
      const covered = tokens.filter(inPool).length / tokens.length >= 0.5;
      // A distinctive short name (MCP, API, SEO) appearing in a heading identifies the section on its own.
      const acronym = tokens.some((t) => t.length <= 4 && new RegExp(`\\b${esc(t)}\\b`).test(headingPool));
      if (covered || acronym) return `the page already has a section named like "${m[1].trim()}"`;
    }
  }

  // Files and tags that exist.
  // FAQ answers "in plain HTML": when FAQPage markup exists, the FAQ is visible, and the raw
  // (no-JavaScript) page carries essentially all the rendered words, the answers are already there.
  if (/\bfaq\b|questions? and answers?|q&a/.test(text) && /plain html|raw html|directly beneath|immediately follow|accordion|server-rendered|without javascript/.test(text)
    && signals?.sections.faq && entities.some((e) => e.type === 'FAQPage')
    && rvr && !rvr.rawFetchUnreliable && rvr.renderedWords > 0 && rvr.rawWords >= 0.8 * rvr.renderedWords) {
    return 'the FAQ is visible and its text is already in the raw HTML that crawlers receive without JavaScript';
  }
  if (crawl.llmsTxtFound && /llms\.txt/.test(text) && asks(text, 'llms.txt') && !/(link|attribution|licen[cs]e|usage|terms|cite|citation|contents?|policy)/.test(text)) {
    return 'llms.txt exists (the check found it)';
  }
  if (crawl.sitemapFound && /sitemap/.test(text) && asks(text, 'sitemap') && !/(update|lastmod|submit|index|reference|robots)/.test(text)) {
    return 'a sitemap exists (the check found it)';
  }
  // Presence rules: only when the text asks for the element to exist, and is not about changing it
  // or about other pages/templates.
  const presenceOnly = (term: string) => asksToCreate(text, term) && !MODIFIES.test(text) && !ELSEWHERE.test(text);
  if (page.meta.description && presenceOnly('description')) return 'the page already has a meta description';
  if (page.meta.canonical && presenceOnly('canonical')) return 'the page already declares a canonical URL';
  if (page.meta.viewport && presenceOnly('viewport')) return 'the page already has a viewport tag';
  if (page.headings.h1.length > 0 && presenceOnly('h1') && !/(multiple|more than one|several)/.test(text)) return 'the page already has an H1';

  return null;
}
