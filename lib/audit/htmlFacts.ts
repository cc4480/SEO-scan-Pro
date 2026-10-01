import type { SchemaEntity, SchemaFacts } from '../../src/types';

// Plain-text and structure measurements over an HTML string, used identically for the raw response
// and the rendered DOM so the two numbers are directly comparable.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…' };

export function decode(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e: string) => {
    const k = e.toLowerCase();
    if (ENTITIES[k] !== undefined) return ENTITIES[k];
    const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : k.startsWith('#') ? parseInt(k.slice(1), 10) : NaN;
    if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) { try { return String.fromCodePoint(code); } catch { return m; } }
    return m;
  });
}

/**
 * Text a reader would see. `includeNoscript` is true for a raw (no-JavaScript) response, where the
 * <noscript> block IS the page, and false for a rendered DOM, where a browser hides it.
 */
// Inline elements sit inside a word's line of text: removing them must not split a word. Some pages
// (example.com in 2026 animates its text) wrap every single letter in a <span>, and turning those
// tags into spaces reads "This" as "T h i s" and inflates the word count several times over.
const INLINE_TAG = /<\/?(?:a|abbr|b|bdi|bdo|cite|code|data|dfn|em|font|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var)(?:\s[^>]*)?>/gi;

/** Markup to text: inline tags vanish, every other tag becomes a space so adjacent blocks do not glue together. */
export function tagsToText(html: string): string {
  return decode(html.replace(INLINE_TAG, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function textOf(html: string, includeNoscript: boolean): string {
  let h = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  if (!includeNoscript) h = h.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  return tagsToText(h);
}

export function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** Real <a href> links. Click handlers on buttons and divs are not links and are not counted. */
export function anchorCount(html: string, includeNoscript: boolean): number {
  const h = includeNoscript ? html : html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  return (h.match(/<a\s[^>]*\bhref\s*=\s*["'][^"'#\s][^"']*["']/gi) || []).length;
}

/** <button>s and anchors inside header/nav/footer regions: navigation built from non-links shows up as buttons > anchors. */
export function navigationControls(html: string): { buttons: number; anchors: number } {
  let buttons = 0;
  let anchors = 0;
  const region = /<(header|nav|footer)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = region.exec(html)) !== null) {
    buttons += (m[2].match(/<button\b/gi) || []).length;
    anchors += (m[2].match(/<a\s[^>]*\bhref\s*=/gi) || []).length;
  }
  return { buttons, anchors };
}

// ---- JSON-LD -----------------------------------------------------------------------------------

const asArray = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

function entityFrom(node: Record<string, unknown>, type: string): SchemaEntity {
  const prices: SchemaEntity['prices'] = [];
  for (const offer of asArray(node.offers)) {
    if (offer && typeof offer === 'object') {
      const o = offer as Record<string, unknown>;
      const price = str(o.price) || str((o.priceSpecification as Record<string, unknown> | undefined)?.price);
      if (price) prices.push({ price, currency: str(o.priceCurrency) });
    }
  }
  const nameOf = (v: unknown): string => (v && typeof v === 'object' ? str((v as Record<string, unknown>).name) : '');
  return {
    type,
    props: Object.keys(node).filter((k) => !k.startsWith('@')),
    prices,
    version: str(node.softwareVersion) || undefined,
    totalTime: str(node.totalTime) || undefined,
    stepNames: type === 'HowTo' ? asArray(node.step).map(nameOf).filter(Boolean) : [],
    questions: type === 'FAQPage' ? asArray(node.mainEntity).map(nameOf).filter(Boolean) : [],
    hasRating: 'aggregateRating' in node,
    hasReview: 'review' in node
  };
}

function walk(node: unknown, out: SchemaEntity[]): void {
  if (Array.isArray(node)) { node.forEach((c) => walk(c, out)); return; }
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  for (const t of asArray(obj['@type'])) {
    if (typeof t === 'string' && t.trim()) out.push(entityFrom(obj, t.trim()));
  }
  Object.values(obj).forEach((c) => walk(c, out));
}

/** Every typed entity in the page's JSON-LD (including @graph and nested ones) with the properties it actually carries. */
export function schemaEntities(html: string): SchemaEntity[] {
  const out: SchemaEntity[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try { walk(JSON.parse(m[1].trim()), out); } catch { /* malformed JSON-LD is the site's problem, not a scan failure */ }
  }
  return out;
}

export function schemaTypes(entities: SchemaEntity[]): string[] {
  return Array.from(new Set(entities.map((e) => e.type)));
}

const norm = (s: string) => decode(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * HowTo steps and FAQ questions that appear in the markup but not in the text a visitor sees.
 * Markup is meant to describe visible content; steps or answers that exist only in JSON-LD are
 * a structured-data policy problem.
 */
export function invisibleSchemaItems(entities: SchemaEntity[], visibleText: string): SchemaFacts['invisible'] {
  const haystack = norm(visibleText);
  const out: SchemaFacts['invisible'] = [];
  const present = new Set(haystack.split(' '));
  const check = (type: string, items: string[]) => {
    if (!items.length) return;
    // Visible if the exact wording appears, or most of its distinctive words do: a page may
    // paraphrase a step, and paraphrasing is not hiding it.
    const missing = items.filter((i) => {
      const n = norm(i);
      if (!n || haystack.includes(n.slice(0, 60))) return false;
      const sig = n.split(' ').filter((w) => w.length > 3);
      return sig.length === 0 || sig.filter((w) => present.has(w)).length / sig.length < 0.6;
    });
    if (missing.length) out.push({ type, items: missing.slice(0, 5), total: items.length });
  };
  const seen = new Set<string>();
  for (const e of entities) {
    for (const [type, items] of [['HowTo', e.stepNames], ['FAQPage', e.questions]] as const) {
      const key = type + items.join('|');
      if (items.length && !seen.has(key)) { seen.add(key); check(type, items); }
    }
  }
  return out;
}
