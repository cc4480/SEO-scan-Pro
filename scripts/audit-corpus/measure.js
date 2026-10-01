// Runs INSIDE the page (page.evaluate). Plain JavaScript on purpose: a bundler must not inject
// helpers into it. Measures the page with live DOM queries, independently of the scanner's parser.
(() => {
  const types = new Set();
  const entities = [];
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== 'object') return;
    const t = n['@type'];
    (Array.isArray(t) ? t : [t]).forEach((x) => {
      if (typeof x === 'string') { types.add(x); entities.push({ type: x, props: Object.keys(n).filter((k) => !k.startsWith('@')) }); }
    });
    Object.values(n).forEach(walk);
  };
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { walk(JSON.parse(s.textContent || '')); } catch (e) { /* ignore */ } });

  const imgs = Array.from(document.querySelectorAll('img'));
  const links = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '');
  const real = links.filter((h) => h && !h.startsWith('#') && !/^(javascript|mailto|tel):/i.test(h));
  const host = location.hostname.replace(/^www\./, '');
  const internal = real.filter((h) => { try { return new URL(h, location.href).hostname.replace(/^www\./, '') === host; } catch (e) { return false; } });
  const heads = (tag) => Array.from(document.querySelectorAll(tag)).map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim());
  const meta = (sel, attr) => { const el = document.querySelector(sel); return (el && el.getAttribute(attr || 'content')) || ''; };
  const clean = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();

  return {
    title: document.title,
    description: meta('meta[name="description" i]'),
    canonical: meta('link[rel="canonical"]', 'href'),
    viewport: meta('meta[name="viewport"]'),
    lang: document.documentElement.lang || '',
    robotsMeta: meta('meta[name="robots" i]'),
    h1: heads('h1'),
    h2Count: document.querySelectorAll('h2').length,
    h3Count: document.querySelectorAll('h3').length,
    imagesTotal: imgs.length,
    imagesWithSrc: imgs.filter((i) => i.getAttribute('src') || i.getAttribute('data-src') || i.currentSrc).length,
    imagesNoAltAttr: imgs.filter((i) => !i.hasAttribute('alt')).length,
    imagesEmptyAlt: imgs.filter((i) => i.hasAttribute('alt') && !(i.getAttribute('alt') || '').trim()).length,
    anchors: real.length,
    internalAnchors: internal.length,
    hashAnchors: links.length - real.length,
    jsonLdTypes: Array.from(types),
    jsonLdEntities: entities,
    hreflang: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((l) => l.getAttribute('hreflang') || ''),
    og: { title: meta('meta[property="og:title"]'), description: meta('meta[property="og:description"]'), image: meta('meta[property="og:image"]') },
    bodyText: ((document.body && document.body.innerText) || '').replace(/\s+/g, ' ').trim(),
    headingsText: Array.from(document.querySelectorAll('h1,h2,h3')).map(clean).slice(0, 80),
    navLabels: Array.from(document.querySelectorAll('nav a, header a, footer a, nav button, header button')).map(clean).filter((t) => t && t.length < 60).slice(0, 120),
    navButtons: document.querySelectorAll('nav button, header button, footer button').length,
    navAnchors: document.querySelectorAll('nav a[href], header a[href], footer a[href]').length
  };
})()
