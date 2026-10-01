import { describe, it, expect } from 'vitest';
import { staticContentFor, STAGE_LABELS } from '../../lib/staticPages';
import { renderIndex } from '../../lib/indexHtml';
import { AUDIT_CHECKS } from '../../src/auditChecks';
import { PLANS } from '../../src/plans';
import { PRIVACY, TERMS } from '../../src/legal/content';

const count = (s: string, re: RegExp) => (s.match(re) || []).length;

describe('static (no-JavaScript) pages', () => {
  const home = staticContentFor('/');

  it('lists exactly the audit stages the app shows', () => {
    expect(STAGE_LABELS).toEqual(AUDIT_CHECKS.map((c) => c.label));
    for (const label of AUDIT_CHECKS) expect(home).toContain(label.label.replace('&', '&amp;'));
  });

  it('has one H1, real links, and the real prices', () => {
    expect(count(home, /<h1>/g)).toBe(1);
    expect(count(home, /<a href="\//g)).toBeGreaterThanOrEqual(8);
    for (const href of ['/signup', '/login', '/terms', '/privacy']) expect(home).toContain(`href="${href}"`);
    expect(home).toContain(`$${PLANS.STARTER.priceMonthly}`);
    expect(home).toContain(`$${PLANS.STARTER.priceYearly}`);
    expect(home).toContain(`$${PLANS.AGENCY.priceYearly}`);
  });

  it('is substantial: enough words for a crawler without JavaScript', () => {
    const words = home.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThan(450);
  });

  it('renders the legal pages from the same text the app shows', () => {
    for (const [path, doc] of [['/terms', TERMS], ['/privacy', PRIVACY]] as const) {
      const html = staticContentFor(path);
      expect(html).toContain(`<h1>${doc.title}</h1>`);
      expect(count(html, /<h2>/g)).toBe(doc.sections.length);
    }
  });

  it('adds nothing for the app, the widget, or unknown paths', () => {
    for (const p of ['/login', '/embed', '/api/x', '/whatever']) expect(staticContentFor(p)).toBe('');
    expect(staticContentFor('/terms/')).not.toBe('');
  });

  it('is placed into the shell where the token is, and hidden from sight', () => {
    const out = renderIndex('<div id="root">__STATIC_CONTENT__</div>', 'https://x.test', '/', staticContentFor('/'));
    expect(out).toContain('<div id="seo-static" class="sr-only">');
    expect(out).not.toContain('__STATIC_CONTENT__');
    expect(renderIndex('<div id="root">__STATIC_CONTENT__</div>', 'https://x.test', '/login', staticContentFor('/login'))).toBe('<div id="root"></div>');
  });
});
