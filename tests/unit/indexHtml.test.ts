import { describe, it, expect } from 'vitest';
import { renderIndex } from '../../lib/indexHtml';
import { contentSecurityPolicy } from '../../lib/csp';

const tpl = '<link rel="canonical" href="__CANONICAL__"><meta property="og:image" content="__APP_URL__/og.png">';

describe('renderIndex', () => {
  it('fills the absolute origin and a per-page canonical', () => {
    expect(renderIndex(tpl, 'https://app.example.com/', '/')).toBe(
      '<link rel="canonical" href="https://app.example.com/"><meta property="og:image" content="https://app.example.com/og.png">'
    );
    expect(renderIndex(tpl, 'https://app.example.com', '/terms')).toContain('href="https://app.example.com/terms"');
    expect(renderIndex(tpl, 'https://app.example.com', '/privacy/')).toContain('href="https://app.example.com/privacy"');
  });

  it('points non-public paths (login, embed, anything else) at the home page', () => {
    for (const p of ['/login', '/embed', '/whatever/else']) {
      expect(renderIndex(tpl, 'https://app.example.com', p)).toContain('href="https://app.example.com/"');
    }
  });
});

describe('contentSecurityPolicy', () => {
  it('refuses inline script and framing by other sites on normal pages', () => {
    const csp = contentSecurityPolicy('/');
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it('lets only the widget frame be embedded by other origins', () => {
    expect(contentSecurityPolicy('/embed')).toContain('frame-ancestors *');
    expect(contentSecurityPolicy('/terms')).toContain("frame-ancestors 'self'");
  });
});
