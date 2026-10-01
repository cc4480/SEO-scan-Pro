import type { ContentSignals } from '../../src/types';
import { decode } from './htmlFacts';

// What the rendered page visibly contains, read from its headings, navigation labels and text. A
// recommendation to "add a pricing section" is only legitimate if this says there is none.

const headingsOf = (html: string): string[] =>
  Array.from(html.matchAll(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi)).map((m) => decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().toLowerCase());

const linkLabels = (html: string): string[] =>
  Array.from(html.matchAll(/<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi)).map((m) => decode(m[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().toLowerCase()).filter((s) => s.length > 0 && s.length < 60);

// A dollar amount: digits with optional thousands separators and cents. The final character must be
// a digit, so "$29," in running text is read as "$29".
const PRICE = /\$\s?\d(?:[\d,]*\d)?(?:\.\d{1,2})?/g;

export function contentSignals(renderedHtml: string, visibleText: string, hreflangCount: number): ContentSignals {
  const heads = headingsOf(renderedHtml);
  const labels = linkLabels(renderedHtml);
  const both = [...heads, ...labels];
  const has = (re: RegExp, pool: string[] = both) => pool.some((s) => re.test(s));

  const prices = Array.from(new Set((visibleText.match(PRICE) || []).map((p) => p.replace(/\s+/g, '')))).slice(0, 12);
  const text = visibleText.toLowerCase();

  const reviews =
    has(/\b(testimonials?|reviews?|what (our )?(customers|clients|users|people) (say|think))\b/, heads) ||
    /\b\d(\.\d)?\s*(\/|out of)\s*5\b/.test(text) ||
    /★{3,}/.test(visibleText);

  return {
    sections: {
      pricing: prices.length > 0 || has(/\b(pricing|plans?|purchase|buy credits|credits)\b/),
      faq: has(/\b(faq|frequently asked|common questions|questions)\b/),
      howItWorks: has(/\bhow (it|this|[a-z]+) works?\b|\bgetting started\b|\bhow to\b|\bsteps?\b/, heads),
      features: has(/\b(features|what we (test|check|cover|scan)|capabilities|pillars|benefits|what you get|checks)\b/, heads),
      about: has(/\babout( us)?\b|\bour (story|team|mission)\b/),
      contact: has(/\bcontact( us)?\b|\bget in touch\b/),
      reviews
    },
    prices,
    hasVisibleReviews: reviews,
    multiLanguage: hreflangCount > 0
  };
}
