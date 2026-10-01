import type { ContentSignals } from '../../src/types';
import { decode, textOf } from './htmlFacts';

// What the rendered page visibly contains, read from its headings, navigation labels and text. A
// recommendation to "add a pricing section" is only legitimate if this says there is none.

const headingsOf = (html: string): string[] =>
  Array.from(html.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)).map((m) => decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().toLowerCase());

// A navigation label proves a section exists only when it points INTO this page ("#faq"). A footer
// link "FAQ" that goes to /faq says another page has one, not this page. Buttons carry no href, so
// they prove nothing either.
const linkLabels = (html: string): string[] =>
  Array.from(html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi))
    .filter((m) => /\bhref\s*=\s*(?:"\s*#|'\s*#|#)/i.test(m[1]))
    .map((m) => decode(m[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((s) => s.length > 0 && s.length < 60);

/** First ~120 words of the main visible text (<main>/<article> if present, else the body). */
export function openingTextOf(renderedHtml: string, maxWords = 120): string {
  const region = /<(main|article)\b[^>]*>([\s\S]*?)<\/\1>/i.exec(renderedHtml);
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(renderedHtml);
  const text = textOf(region ? region[2] : body ? body[1] : renderedHtml, false);
  return text.split(/\s+/).filter(Boolean).slice(0, maxWords).join(' ');
}

// A dollar amount: digits with optional thousands separators and cents. The final character must be
// a digit, so "$29," in running text is read as "$29".
const PRICE = /\$\s?\d(?:[\d,]*\d)?(?:\.\d{1,2})?/g;

// Language-switcher links: relative links whose first path segment is a language code ("/de/", "/pt-BR/").
// A page offering several of them has language versions even when it declares no hreflang tags.
const LANGS = new Set(['ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'et', 'fa', 'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'nb', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'th', 'tr', 'uk', 'vi', 'zh']);
export function localeLinksOf(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["'](\/([a-z]{2})(?:-[A-Za-z]{2,4})?)\/?(?:[?#][^"']*)?["']/gi)) {
    if (LANGS.has(m[2].toLowerCase())) found.add(m[1].toLowerCase());
  }
  return Array.from(found);
}

/** The robots.txt "Content-Signal: search=yes, ai-input=yes, ai-train=no" preference, if any. */
export function contentSignalOf(robotsText?: string | null): ContentSignals['contentSignal'] {
  if (!robotsText) return undefined;
  let out: NonNullable<ContentSignals['contentSignal']> | undefined;
  for (const line of robotsText.split(/\r?\n/)) {
    const m = /^\s*content-signal\s*:(.*)$/i.exec(line);
    if (!m) continue;
    out = out ?? {};
    for (const pair of m[1].split(',')) {
      const kv = /^\s*(search|ai-input|ai-train)\s*=\s*(yes|no)\s*$/i.exec(pair.split('#')[0]);
      if (!kv) continue;
      const key = kv[1].toLowerCase() === 'search' ? 'search' : kv[1].toLowerCase() === 'ai-input' ? 'aiInput' : 'aiTrain';
      out[key] = kv[2].toLowerCase() === 'yes';
    }
  }
  return out;
}

export function contentSignals(renderedHtml: string, visibleText: string, hreflangCount: number, robotsText?: string | null): ContentSignals {
  const localeLinks = localeLinksOf(renderedHtml);
  const allHeads = headingsOf(renderedHtml);
  // A section heading is short. A 15-word article headline that happens to contain "questions" or
  // "reviews" (a news homepage) is not a FAQ or reviews section.
  const heads = allHeads.filter((h) => h.split(/\s+/).length <= 8);
  const labels = linkLabels(renderedHtml);
  const both = [...heads, ...labels];
  const has = (re: RegExp, pool: string[] = both) => pool.some((s) => re.test(s));

  const prices = Array.from(new Set((visibleText.match(PRICE) || []).map((p) => p.replace(/\s+/g, '')))).slice(0, 12);
  const text = visibleText.toLowerCase();

  // A price is pricing only in a plan/price context, and not when it is a donation or support ask.
  const pricedInContext = Array.from(visibleText.matchAll(new RegExp(PRICE.source, 'g'))).some((m) => {
    const around = visibleText.slice(Math.max(0, (m.index ?? 0) - 80), (m.index ?? 0) + 80).toLowerCase();
    return /\b(plans?|pricing|tiers?|packages?|subscription|billed|free trial|per seat|per user)\b/.test(around) && !/\b(donat\w*|support|contribut\w*|give|gift|fund|journalism)\b/.test(around);
  });

  // A reviews section is headed by (almost) only that word; a headline about a book review is not one.
  const reviews =
    has(/^(?:(?:customer|user|client|verified|product|our)\s+)?(?:reviews?|testimonials?)(?:\s+(?:and|&)\s+ratings?)?$|^what (?:our )?(?:customers|clients|users|people) (?:say|think)/, heads) ||
    /\b\d(\.\d)?\s*(\/|out of)\s*5\b/.test(text) ||
    /★{3,}/.test(visibleText);
  const customerStories = /\b(customer|success|client) stories\b|\bcase stud(?:y|ies)\b|\btestimonials?\b/.test(text) || has(/\b(customer|success|client) stories\b|\bcase stud(?:y|ies)\b|\btestimonials?\b/, allHeads);

  return {
    sections: {
      pricing: pricedInContext || has(/\b(pricing|plans?|purchase|buy credits|credits)\b/),
      faq: has(/\b(faq|frequently asked|common questions)\b|^(?:questions(?: (?:and|&) answers)?|q ?&(?:amp;)? ?a)$/),
      // Headings and navigation labels both count: a "How it works" nav link points at that section.
      howItWorks: has(/\bhow (it|this|[a-z]+(?: [a-z]+)?) works?\b|\bgetting started\b/),
      features: has(/\b(features|what we (test|check|cover|scan)|capabilities|pillars|benefits|what you get|checks)\b/, heads),
      about: has(/\babout( us)?\b|\bour (story|team|mission)\b/),
      contact: has(/\bcontact( us)?\b|\bget in touch\b/),
      reviews
    },
    prices,
    hasVisibleReviews: reviews,
    customerStories,
    multiLanguage: hreflangCount > 0 || localeLinks.length >= 3,
    localeLinks: localeLinks.length >= 3 ? localeLinks.slice(0, 20) : undefined,
    contentSignal: contentSignalOf(robotsText),
    openingText: openingTextOf(renderedHtml)
  };
}
