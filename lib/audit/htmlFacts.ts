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

// ---- Tag / attribute tokenizer -------------------------------------------------------------------
// Attribute values may contain the other quote character ("world's") and even '>' ("a > b"), so a
// character class like ["'][^"']*["'] or a [^>]* tag body cuts values short. These helpers honour
// the opening quote, accept unquoted values and ignore attribute order.

export type Attrs = Record<string, string>;

/** Parses the inside of a start tag (everything after the tag name). Names are lower-cased, values decoded, the first duplicate wins. */
export function parseAttrs(src: string): Attrs {
  const out: Attrs = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const name = m[1].toLowerCase();
    if (name in out) continue;
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    out[name] = decode(value);
  }
  return out;
}

export interface TagMatch {
  attrs: Attrs;
  /** Index of the '<' and the index just after the '>' of the start tag. */
  start: number;
  end: number;
}

// A start tag body: runs of quoted strings (which may contain '>') or any non-quote, non-'>' character.
const TAG_BODY = '((?:"[^"]*"|\'[^\']*\'|[^>"\'])*)';

/** Every start tag with the given name, in document order, with its attributes parsed. */
export function findTags(html: string, name: string): TagMatch[] {
  const re = new RegExp(`<${name}(?=[\\s/>])${TAG_BODY}>`, 'gi');
  const out: TagMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push({ attrs: parseAttrs(m[1]), start: m.index, end: m.index + m[0].length });
  return out;
}

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** True when an element's own attributes make a browser hide it from a reader. */
function isHiddenByAttrs(a: Attrs): boolean {
  if ('hidden' in a) return true;
  const style = (a.style || '').toLowerCase().replace(/\s+/g, '');
  return /(^|;)display:none(;|!important|$)/.test(style) || /(^|;)visibility:hidden(;|!important|$)/.test(style);
}

/**
 * Removes elements a reader cannot see, judged from their own attributes only: the `hidden`
 * attribute and inline display:none / visibility:hidden. Best effort: it cannot know what a
 * stylesheet or script hides. aria-hidden is NOT treated as hidden: it only hides content from
 * screen readers, and a browser's innerText still includes it.
 */
export function stripHidden(html: string): string {
  const re = new RegExp(`<(/?)([a-zA-Z][a-zA-Z0-9-]*)${TAG_BODY}>`, 'g');
  let out = '';
  let cursor = 0;
  let skip: { name: string; depth: number } | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (skip) {
      if (name === skip.name && !VOID_TAGS.has(name)) {
        if (!closing && !m[3].trimEnd().endsWith('/')) skip.depth++;
        else if (closing && --skip.depth === 0) {
          cursor = m.index + m[0].length;
          skip = null;
        }
      }
      continue;
    }
    if (closing || VOID_TAGS.has(name) || m[3].trimEnd().endsWith('/')) continue;
    if (isHiddenByAttrs(parseAttrs(m[3]))) {
      out += html.slice(cursor, m.index);
      skip = { name, depth: 1 };
    }
  }
  // An unclosed hidden element hides the rest of the document, as a browser would.
  return skip ? out : out + html.slice(cursor);
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
  // Only the body is text a reader sees: the <title> and other <head> text are not part of innerText.
  const body = findTags(html, 'body')[0];
  let h = (body ? html.slice(body.end) : html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  if (!includeNoscript) h = h.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  return tagsToText(stripHidden(h));
}

export function wordCount(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

/** Real <a href> links. Click handlers on buttons and divs are not links and are not counted. */
export function anchorCount(html: string, includeNoscript: boolean): number {
  // Inert markup is not a link a reader or crawler sees: <template> contents, markup quoted inside
  // scripts (inline JSON / HTML strings) and comments (MDN: 169 counted vs 158 real anchors).
  let h = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  if (!includeNoscript) h = h.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  // Same rule as the scanner's own link list: a real href, not an in-page '#' jump or a javascript:/mailto:/tel: pseudo-link.
  return findTags(h, 'a').filter((t) => {
    const href = (t.attrs.href || '').trim();
    return href !== '' && !href.startsWith('#') && !/^(javascript|mailto|tel):/i.test(href);
  }).length;
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
