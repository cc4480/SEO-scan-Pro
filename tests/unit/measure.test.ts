import { describe, it, expect } from 'vitest';
import { parsePage, isBrokenStatus } from '../../lib/crawler';
import { anchorCount, findTags, parseAttrs, stripHidden, textOf, wordCount } from '../../lib/audit/htmlFacts';
import { classifyChallenge, classifyRawResponse } from '../../lib/audit/challenge';

const U = 'https://example.com/';

describe('attribute tokenizer (A-14)', () => {
  it('keeps an apostrophe inside a double-quoted meta description', () => {
    const html = `<meta name="description" content="Join the world's most widely adopted developer platform.">`;
    expect(parsePage(U, html, 1).meta.description).toBe("Join the world's most widely adopted developer platform.");
  });

  it('keeps a double quote inside a single-quoted value', () => {
    const html = `<meta name='description' content='He said "hello" to the world'>`;
    expect(parsePage(U, html, 1).meta.description).toBe('He said "hello" to the world');
  });

  it('reads a value containing > without ending the tag early', () => {
    const html = `<meta content="Fast > slow, a &gt; b" name="description"><meta name="robots" content="noindex">`;
    const r = parsePage(U, html, 1);
    expect(r.meta.description).toBe('Fast > slow, a > b');
    expect(r.meta.robots).toBe('noindex');
  });

  it('reads unquoted attributes and any attribute order', () => {
    const html = `<meta content=width=device-width,initial-scale=1 name=viewport><link href=https://example.com/c rel=canonical>`;
    const r = parsePage(U, html, 1);
    expect(r.meta.viewport).toBe('width=device-width,initial-scale=1');
    expect(r.meta.canonical).toBe('https://example.com/c');
  });

  it('reads Open Graph and Twitter tags with apostrophes', () => {
    const html = `<meta property="og:title" content="Nike's best"><meta property="og:description" content="It's here"><meta name="twitter:card" content="summary_large_image">`;
    const r = parsePage(U, html, 1);
    expect(r.social!.ogTitle).toBe("Nike's best");
    expect(r.social!.ogDescription).toBe("It's here");
    expect(r.social!.twitterCard).toBe('summary_large_image');
  });

  it('reads hreflang alternates, <html lang> and a rel list containing several tokens', () => {
    const html = `<html lang='en-GB'><link rel="alternate" hreflang="fr" href="https://example.com/fr"><link href="/x" rel="preload canonical">`;
    const r = parsePage(U, html, 1);
    expect(r.lang).toBe('en-GB');
    expect(r.hreflang).toEqual([{ lang: 'fr', href: 'https://example.com/fr' }]);
    expect(r.meta.canonical).toBe('/x');
  });

  it('decodes entities in attribute values (URLs and alt text)', () => {
    const html = `<img src="/a.jpg?w=1&amp;h=2" alt="Tom &amp; Jerry's &lt;b&gt;">`;
    const img = parsePage(U, html, 1).images.list[0];
    expect(img.src).toBe('/a.jpg?w=1&h=2');
    expect(img.alt).toBe("Tom & Jerry's <b>");
  });

  it('reads alt text with apostrophes and links with > in the title attribute', () => {
    const html = `<img src="/a.jpg" alt="The world's best"><a href="/p" title="a > b">Go there</a>`;
    const r = parsePage(U, html, 1);
    expect(r.images.list[0].alt).toBe("The world's best");
    expect(r.images.missingAlt).toBe(0);
    expect(r.links.list[0]).toMatchObject({ href: 'https://example.com/p', text: 'Go there' });
  });

  it('parseAttrs handles bare attributes, duplicates and mixed quoting', () => {
    expect(parseAttrs(`hidden data-x='1' data-y="two words" class=a data-x="2"`)).toEqual({ hidden: '', 'data-x': '1', 'data-y': 'two words', class: 'a' });
    expect(findTags(`<a href="x>y">t</a><abbr>no</abbr>`, 'a')).toHaveLength(1);
  });
});

describe('alt text split and lazy images (A-08, A-11)', () => {
  it('separates alt="" (decorative, valid) from a missing alt attribute', () => {
    const html = `<img src="/a.jpg" alt="x"><img src="/b.jpg" alt=""><img src="/c.jpg" alt=" "><img src="/d.jpg">`;
    const r = parsePage(U, html, 1);
    expect(r.images).toMatchObject({ total: 4, noAltAttribute: 1, emptyAlt: 2, missingAlt: 1 });
  });

  it('counts lazy images that have data-src or srcset but no src', () => {
    const html = `<img data-src="/lazy.jpg" alt="l"><img srcset="/s1.jpg 1x, /s2.jpg 2x" alt="s"><img src="data:image/gif;base64,R0lGOD" data-src="/real.jpg" alt="r"><img src="/n.jpg" alt="n"><img alt="nothing">`;
    const r = parsePage(U, html, 1);
    expect(r.images.total).toBe(4);
    expect(r.images.lazyNoSrc).toBe(3);
    expect(r.images.list.map((i) => i.src)).toEqual(['/lazy.jpg', '/s1.jpg', '/real.jpg', '/n.jpg']);
  });

  it('ignores markup quoted inside scripts, templates and comments (links/images are not real)', () => {
    const html = `<body><a href="/real">r</a><script>var t = '<a href="/fake1">x</a><img src="/fake.png">';</script>
      <template><a href="/fake2">y</a></template><!-- <a href="/fake3">z</a> --><h2>Real</h2><script>x='<h2>Fake</h2>'</script></body>`;
    const r = parsePage(U, html, 1);
    expect(r.links.total).toBe(1);
    expect(r.images.total).toBe(0);
    expect(r.headings.h2).toEqual(['Real']);
  });

  it('classifies protocol-relative and relative links correctly', () => {
    const html = `<a href="//cdn.other.com/x">c</a><a href="page.html">p</a><a href="https://www.example.com/q">q</a><a href="">e</a>`;
    const r = parsePage(U, html, 1);
    expect(r.links.total).toBe(3);
    expect(r.links.external).toBe(1);
    expect(r.links.internal).toBe(2);
  });
});

describe('visible word count (A-09)', () => {
  const html = `<html><head><title>One two three</title></head><body>
    <nav hidden><a href="/a">Hidden menu entry one</a></nav>
    <div aria-hidden="true">Decorative duplicate</div>
    <div style="display: none">Never shown text here</div>
    <main><h1>Visible heading</h1><p>Visible paragraph words</p></main></body></html>`;

  it('uses the browser innerText as the source of truth when supplied', () => {
    expect(parsePage(U, html, 1, undefined, 'Visible heading Visible paragraph words').wordCount).toBe(5);
    expect(parsePage(U, html, 1, undefined, '').wordCount).toBe(0);
  });

  it('falls back to the markup, minus elements the markup itself hides and the title', () => {
    // aria-hidden stays: a browser's innerText includes it.
    expect(parsePage(U, html, 1).wordCount).toBe(7);
  });

  it('stripHidden removes nested hidden elements and keeps siblings', () => {
    const s = stripHidden(`<div>keep</div><div hidden><div>inner</div>gone</div><p>after</p><div style="visibility:hidden">x</div>`);
    expect(textOf(`<body>${s}</body>`, false)).toBe('keep after');
  });

  it('raw-side text excludes head text and hidden blocks', () => {
    expect(wordCount(textOf(html, true))).toBe(7);
  });

  it('anchorCount ignores anchors inside <template>, scripts and comments (N-08)', () => {
    const html = `<a href="/real">r</a><template><a href="/t1">t</a><a href="/t2">t</a></template><script>var s='<a href="/s">x</a>'</script><!-- <a href="/c">c</a> --><noscript><a href="/n">n</a></noscript>`;
    expect(anchorCount(html, true)).toBe(2);
    expect(anchorCount(html, false)).toBe(1);
  });

  it('anchorCount ignores hash and pseudo links and reads > inside attribute values', () => {
    expect(anchorCount(`<a href="#x">a</a><a href="javascript:void(0)">b</a><a title="a>b" href="/ok">c</a><a href='/two'>d</a>`, true)).toBe(2);
  });
});

describe('bot challenge classifier (A-03)', () => {
  const page = (title: string, h1: string[], bodyText: string, extra: Partial<Parameters<typeof classifyChallenge>[0]> = {}) =>
    classifyChallenge({ title, h1, bodyText, ...extra });

  it('flags the Canva interstitial', () => {
    expect(page('Unsupported client – Canva', ['Please update your browser'], 'Please update your browser to continue.', { robots: 'noindex,nofollow,noarchive' })).toBeTruthy();
  });

  it('flags Cloudflare and Akamai walls by title', () => {
    expect(page('Just a moment...', [], 'www.w3.org Performing security verification')).toBeTruthy();
    expect(page('Attention Required! | Cloudflare', [], 'Sorry, you have been blocked')).toBeTruthy();
    expect(page('Access Denied', [], "You don't have permission to access this server.", { status: 403 })).toBeTruthy();
  });

  it("flags Amazon's no-JavaScript robot check", () => {
    expect(page('', ['JavaScript is disabled'], "JavaScript is disabled\nIn order to continue, we need to verify that you're not a robot. This requires JavaScript.", { status: 202 })).toBeTruthy();
  });

  it('flags a near-empty page that speaks in challenge words even with a normal title', () => {
    expect(page('Example', [], 'Checking if the site connection is secure. Verify you are human by completing the action below.')).toBeTruthy();
    expect(page('Shop', ['Hold on'], 'Press and hold to confirm you are a human (and not a bot).')).toBeTruthy();
  });

  it('does not flag real pages, even ones that mention challenge words in long content', () => {
    const long = ('Our guide explains captcha design and bot checks and access denied errors. ').repeat(40);
    expect(page('How to fix Access Denied errors | Docs', ['Access denied'], long)).toBeNull();
    expect(page('Wikipedia, the free encyclopedia', ['Main Page'], long)).toBeNull();
    expect(page('Example Domain', ['Example Domain'], 'This domain is for use in documentation examples without needing permission.')).toBeNull();
    expect(page('Sign in', ['Sign in'], 'Email Password Protected by reCAPTCHA')).toBeNull();
  });

  it('does not flag any of the 30 real corpus titles', () => {
    const titles = ['Example Domain', 'Search engine optimization - Wikipedia', 'GitHub: Change is constant', 'BBC News - Breaking news', 'Apple', 'Stripe', 'Agentic Infrastructure - Vercel', 'React', 'MDN Web Docs', 'Shopify: The All-in-One Commerce Platform', 'Amazon.com. Spend less. Smile more.', 'NASA', 'Welcome to GOV.UK', 'Hacker News', 'Reddit - The heart of the internet', 'LinkedIn: Log In or Sign Up', 'Nike. Just Do It. Nike.com', 'Shop Affordable Home Furnishings', 'Airbnb', 'Cloudflare: Build for the agent era', 'Mozilla - Internet for people, not profit', 'Welcome to Python.org', 'craigslist: laredo jobs, apartments', 'Latest news, sport and opinion from the Guardian', 'Newest Questions - Stack Overflow', 'The AI workspace that works for you.', 'Canva: Visual Suite for Everyone', 'W3C'];
    for (const t of titles) expect(page(t, [t], 'Skip to main content. '.repeat(10))).toBeNull();
  });
});

describe('measurement review fixes', () => {
  it('N2: a meta tag with both name and property sets both keys (GOV.UK og:title)', () => {
    const html = `<meta name="title" property="og:title" content="Welcome to GOV.UK"><meta name="description" property="og:description" content="The best place to find government services and information">`;
    const r = parsePage(U, html, 1);
    expect(r.social!.ogTitle).toBe('Welcome to GOV.UK');
    expect(r.social!.ogDescription).toBe('The best place to find government services and information');
    expect(r.meta.description).toBe('The best place to find government services and information');
  });

  it('N5: slash-less and query-only relative hrefs are internal (Hacker News item?id=)', () => {
    const html = `<a href="item?id=1">a</a><a href="user?id=x">b</a><a href="?p=2">c</a><a href="https://elsewhere.org/">d</a>`;
    const r = parsePage('https://news.example.com/', html, 1);
    expect(r.links.internal).toBe(3);
    expect(r.links.external).toBe(1);
    expect(r.links.list[0].href).toBe('https://news.example.com/item?id=1');
  });

  it('A-14 (Nike): a description with an apostrophe is stored in full, not cut at it', () => {
    const d = "Inspiring the world's athletes, Nike delivers innovative products, experiences and services to help you get the most out of your game.";
    expect(parsePage(U, `<meta name="description" content="${d}">`, 1).meta.description).toBe(d);
  });

  it('R3-05: the hreflang total is kept apart from the 50-entry sample', () => {
    const html = Array.from({ length: 70 }, (_, i) => `<link rel="alternate" hreflang="x${i}" href="/x${i}">`).join('');
    const r = parsePage(U, html, 1);
    expect(r.hreflang).toHaveLength(50);
    expect(r.hreflangTotal).toBe(70);
  });

  it('N1 / R4-04: only 404, 410 and real 5xx are broken; walls (401/403/429/503/999) are unverified', () => {
    for (const s of [404, 410, 500, 502, 504]) expect(isBrokenStatus(s)).toBe(true);
    for (const s of [200, 301, 401, 403, 429, 503, 999]) expect(isBrokenStatus(s)).toBe(false);
  });

  it('N3: a raw response that is only a refresh to a verification URL, an empty 202, or a 403 is an interstitial', () => {
    const amazon = `<html><head><meta http-equiv="refresh" content="5; URL='/?bm-verify=AAQAAA'"><title>&nbsp;</title></head><body></body></html>`;
    expect(classifyRawResponse(amazon, 200)).toBeTruthy();
    expect(classifyRawResponse('<html><body></body></html>', 202)).toBeTruthy();
    expect(classifyRawResponse('<html><body>Forbidden</body></html>', 403)).toBeTruthy();
    const page = `<html><head><title>Python</title></head><body>${'Real content words here. '.repeat(60)}</body></html>`;
    expect(classifyRawResponse(page, 200)).toBeNull();
    expect(classifyRawResponse(`<html><head><meta http-equiv="refresh" content="0; url=/home"></head><body>Moved</body></html>`, 200)).toBeNull();
  });
});
