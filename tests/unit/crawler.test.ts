import { describe, it, expect, vi, afterEach } from 'vitest';
import { parsePage, crawlUrl } from '../../lib/crawler';

describe('parsePage', () => {
  it('extracts the title', () => {
    const html = '<html><head><title>My Page Title</title></head><body></body></html>';
    const result = parsePage('https://example.com', html, 100);
    expect(result.meta.title).toBe('My Page Title');
  });

  it('marks real parsed pages as not simulated', () => {
    const result = parsePage('https://example.com', '<html></html>', 100);
    expect(result.isSimulated).toBe(false);
  });

  it('extracts meta description, keywords, viewport, and robots', () => {
    const html = `
      <meta name="description" content="A great page about widgets">
      <meta name="keywords" content="widgets, gadgets">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="robots" content="index, follow">
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.meta.description).toBe('A great page about widgets');
    expect(result.meta.keywords).toBe('widgets, gadgets');
    expect(result.meta.viewport).toBe('width=device-width, initial-scale=1');
    expect(result.meta.robots).toBe('index, follow');
  });

  it('extracts og:-style property meta tags via the property attribute fallback', () => {
    // name= comes first in the regex alternation; description below only has `property`
    const html = `<meta property="description" content="OG description text">`;
    const result = parsePage('https://example.com', html, 100);
    expect(result.meta.description).toBe('OG description text');
  });

  it('extracts a canonical link regardless of attribute order', () => {
    const relFirst = `<link rel="canonical" href="https://example.com/canonical-a">`;
    const hrefFirst = `<link href="https://example.com/canonical-b" rel="canonical">`;
    expect(parsePage('https://example.com', relFirst, 100).meta.canonical).toBe('https://example.com/canonical-a');
    expect(parsePage('https://example.com', hrefFirst, 100).meta.canonical).toBe('https://example.com/canonical-b');
  });

  it('extracts h1/h2/h3 headings in document order, stripping inner tags', () => {
    const html = `
      <h1>Main <strong>Title</strong></h1>
      <h2>First Section</h2>
      <h2>Second Section</h2>
      <h3>Sub point</h3>
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.headings.h1).toEqual(['Main Title']);
    expect(result.headings.h2).toEqual(['First Section', 'Second Section']);
    expect(result.headings.h3).toEqual(['Sub point']);
  });

  it('ignores empty headings', () => {
    const html = `<h1></h1><h1>   </h1><h1>Real Title</h1>`;
    const result = parsePage('https://example.com', html, 100);
    expect(result.headings.h1).toEqual(['Real Title']);
  });

  it('counts images and flags missing alt text', () => {
    const html = `
      <img src="/a.jpg" alt="Has alt text">
      <img src="/b.jpg" alt="">
      <img src="/c.jpg">
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.images.total).toBe(3);
    expect(result.images.missingAlt).toBe(2);
    expect(result.images.list.find(i => i.src === '/a.jpg')?.hasAlt).toBe(true);
    expect(result.images.list.find(i => i.src === '/c.jpg')?.hasAlt).toBe(false);
  });

  it('caps the images list at 30 even if more exist, while total keeps counting', () => {
    const html = Array.from({ length: 40 }, (_, i) => `<img src="/img${i}.jpg" alt="alt${i}">`).join('\n');
    const result = parsePage('https://example.com', html, 100);
    expect(result.images.total).toBe(40);
    expect(result.images.list.length).toBe(30);
  });

  it('classifies links as internal vs external based on hostname', () => {
    const html = `
      <a href="/about">About</a>
      <a href="https://example.com/contact">Contact</a>
      <a href="https://other-domain.com/page">External</a>
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.links.internal).toBe(2);
    expect(result.links.external).toBe(1);
  });

  it('excludes anchor, javascript:, mailto:, and tel: links from the count', () => {
    const html = `
      <a href="#section">Jump</a>
      <a href="javascript:void(0)">Click</a>
      <a href="mailto:test@example.com">Email</a>
      <a href="tel:+15555555555">Call</a>
      <a href="/real-page">Real link</a>
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.links.total).toBe(1);
  });

  it('detects JSON-LD structured data and its @type', () => {
    const html = `
      <script type="application/ld+json">
        { "@context": "https://schema.org", "@type": "Organization", "name": "Acme" }
      </script>
    `;
    const result = parsePage('https://example.com', html, 100);
    expect(result.structuredData.hasJsonLd).toBe(true);
    expect(result.structuredData.types).toContain('Organization');
  });

  it('does not crash on malformed JSON-LD, and does not mark it as valid structured data', () => {
    const html = `<script type="application/ld+json">{ not valid json </script>`;
    expect(() => parsePage('https://example.com', html, 100)).not.toThrow();
    const result = parsePage('https://example.com', html, 100);
    expect(result.structuredData.types).toEqual([]);
  });

  it('does not crash on completely empty or garbage HTML', () => {
    expect(() => parsePage('https://example.com', '', 100)).not.toThrow();
    expect(() => parsePage('https://example.com', '<<<>>>not html at all', 100)).not.toThrow();
  });

  it('computes page size in KB from HTML length', () => {
    const html = 'x'.repeat(2048); // exactly 2KB
    const result = parsePage('https://example.com', html, 100);
    expect(result.pageSizeKb).toBe(2);
  });
});

describe('crawlUrl fallback behavior', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('flags hasSimulatedData=true when the fetch throws (network failure)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await crawlUrl('https://unreachable-site.test', 'SINGLE', 1);
    expect(result.hasSimulatedData).toBe(true);
    expect(result.mainPage.isSimulated).toBe(true);
  });

  it('flags hasSimulatedData=true when the target responds with a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' }));
    const result = await crawlUrl('https://example.com/missing', 'SINGLE', 1);
    expect(result.hasSimulatedData).toBe(true);
  });

  it('does NOT flag hasSimulatedData when the fetch succeeds with real content', async () => {
    vi.stubGlobal('fetch', vi.fn()
      // robots.txt check
      .mockResolvedValueOnce({ ok: false })
      // sitemap check
      .mockResolvedValueOnce({ ok: false })
      // main page fetch
      .mockResolvedValueOnce({ ok: true, text: async () => '<html><title>Real Page</title></html>' })
    );
    const result = await crawlUrl('https://example.com', 'SINGLE', 1);
    expect(result.hasSimulatedData).toBe(false);
    expect(result.mainPage.meta.title).toBe('Real Page');
  });

  it('rejects a completely invalid URL', async () => {
    await expect(crawlUrl('not a url at all::::', 'SINGLE', 1)).rejects.toThrow();
  });
});
