import type { CrawlResult } from '../../src/types';

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

/** Reason the recommendation contradicts the evidence, or null when it stands. `text` is lowercased title + description + remediation. */
export function contradiction(text: string, crawl: CrawlResult): string | null {
  const page = crawl.mainPage;
  const facts = crawl.facts;
  const signals = facts?.signals;
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
        const asksForSection = new RegExp(`\\b${ASK}\\b[^.;]{0,40}\\b${t}\\b[^.;]{0,30}\\b(?:section|page|block|heading|content)\\b`, 'i').test(text);
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
  if (crawl.llmsTxtFound && /llms\.txt/.test(text) && asks(text, 'llms.txt') && !/(link|attribution|licen[cs]e|usage|terms|cite|citation|contents?|policy)/.test(text)) {
    return 'llms.txt exists (the check found it)';
  }
  if (crawl.sitemapFound && /sitemap/.test(text) && asks(text, 'sitemap') && !/(update|lastmod|submit|index|reference|robots)/.test(text)) {
    return 'a sitemap exists (the check found it)';
  }
  if (page.meta.description && asks(text, 'meta description') && !/(too (short|long)|length|unique|improve|rewrite|duplicate)/.test(text)) {
    return 'the page already has a meta description';
  }
  if (page.meta.canonical && asks(text, 'canonical') && !/(wrong|incorrect|mismatch|self-referenc|point)/.test(text)) return 'the page already declares a canonical URL';
  if (page.meta.viewport && asks(text, 'viewport')) return 'the page already has a viewport tag';
  if (page.headings.h1.length > 0 && asks(text, 'h1') && !/(multiple|more than one|several)/.test(text)) return 'the page already has an H1';

  return null;
}
