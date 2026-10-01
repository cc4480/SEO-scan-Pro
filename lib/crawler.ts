import { collectFacts } from './audit/collect';
import { classifyChallenge } from './audit/challenge';
import { robotsAccess, robotsBlocksEveryone } from './audit/robotsRules';
import { BOTS } from './audit/botAccess';
import { decode as decodeHtml, findTags, stripHidden, tagsToText } from './audit/htmlFacts';
import { BrokenLink, CrawlPageData, CrawlResult, DuplicateGroup, ScanMode, SecurityHeaders } from '../src/types';
import { getBrowser } from './browser';
import { clip, heartbeat, noopEmit, type Emit } from './progress';
import { assertPublicUrl, browserRequestAllowed, isBlockedAddress, safeFetch, SsrfBlockedError } from './ssrfGuard';

const CRAWLER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEO-Scan-Pro/1.1';
// Second identity, used once when the first is refused: a standard Chrome token (some sites reject
// agents without one) that still names this tool.
const RETRY_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SEO-Scan-Pro/1.1';

interface RenderedPage {
  html: string;
  status: number;
  ok: boolean;
  loadTimeMs: number;
  ttfbMs?: number;
  /** Response headers of the final main-frame response (lower-cased names). */
  headers: Record<string, string>;
  /** Every URL from the requested one to the final page. */
  redirectChain: string[];
  webVitals?: { lcpMs?: number; cls?: number };
  /**
   * The browser's own `document.body.innerText`: exactly the text a visitor can read, with menus,
   * display:none and visually hidden text left out. Undefined when the page would not answer.
   */
  visibleText?: string;
  /** Total bytes transferred over the network for the whole page load (KB, compressed). */
  transferKb?: number;
  /** Requests the page made while loading. */
  requestCount?: number;
  /** The client identity this load used (reused for the raw and JavaScript-off comparisons). */
  userAgent?: string;
}

// Renders the page in a real (headless) browser rather than a plain fetch, so JavaScript-
// rendered content (SPAs, client-side frameworks) shows up in the crawled HTML instead of
// an empty shell. parsePage() below works on any HTML string, rendered or not, so nothing
// downstream needs to change.
async function renderPage(url: string, timeoutMs: number, emit: Emit = noopEmit, userAgent: string = CRAWLER_USER_AGENT): Promise<RenderedPage> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const startTime = Date.now();
  let beatStop: () => void = () => {};
  try {
    await page.setUserAgent(userAgent);
    // A standard desktop viewport. Puppeteer's default is 800x600, which triggers mobile/tablet
    // layouts and different lazy loading (Nike: CLS 0.185 vs 0.054 and 8 vs 13 H2s at 1366 wide).
    await page.setViewport({ width: 1366, height: 900 });
    // Bytes actually transferred (compressed, all resources), measured from the network layer.
    // The serialized DOM is not the page weight.
    let transferBytes = 0;
    try {
      const cdp = await page.createCDPSession();
      await cdp.send('Network.enable');
      cdp.on('Network.loadingFinished', (e: { encodedDataLength?: number }) => { transferBytes += e.encodedDataLength ?? 0; });
    } catch {
      transferBytes = -1; // not measurable: left undefined below
    }

    // Real page-lifecycle events for the live log: each fires when Chromium reports it, so a slow
    // site reads as "still loading, N requests so far" instead of a silent wait.
    let requestCount = 0;
    page.on('request', () => { requestCount++; });
    let mainResponse: any = null;
    let pageLoaded = false;
    page.on('response', (r) => {
      if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) {
        mainResponse = r; // the latest navigation response wins, i.e. the final page after redirects
        emit('render', 'info', `main document answered HTTP ${r.status()} after ${Date.now() - startTime}ms`);
      }
    });
    page.on('domcontentloaded', () => emit('render', 'info', `DOMContentLoaded after ${Date.now() - startTime}ms`));
    page.on('load', () => {
      pageLoaded = true;
      emit('render', 'info', `load event after ${Date.now() - startTime}ms`);
    });
    const stopBeat = heartbeat(emit, 'render', 'still loading, waiting for the network to go idle', 4000);
    beatStop = stopBeat;

    // Lab Core Web Vitals. The observers must exist before the page's own scripts run, so they
    // are injected into every new document. `buffered: true` replays entries from before the
    // observer attached. These are measured from THIS host, not real users — reported as such.
    await page.evaluateOnNewDocument(() => {
      const w = window as any;
      w.__vitals = { lcp: undefined as number | undefined, cls: 0 };
      try {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as any;
          if (last) w.__vitals.lcp = last.renderTime || last.loadTime || last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as any[]) if (!e.hadRecentInput) w.__vitals.cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {
        // Unsupported entry type: vitals simply stay undefined.
      }
    });

    // Every request the page makes is checked — the navigation, each redirect
    // hop, and every subresource or fetch()/XHR the target's own JavaScript
    // issues. Without this, a scanned page could simply script a request to
    // http://169.254.169.254/ and have this server's browser make it.
    let blockedNavigation: string | null = null;
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return;
      void browserRequestAllowed(req.url()).then((allowed) => {
        if (allowed) return req.continue();
        if (req.isNavigationRequest() && req.frame() === page.mainFrame()) blockedNavigation = req.url();
        return req.abort('blockedbyclient');
      }).catch(() => req.abort('blockedbyclient').catch(() => {}));
    });

    // The request-level guard classifies hostnames, but Chromium does its own DNS resolution
    // afterwards — so a name that passes the check can still connect to a private address (DNS
    // rebinding). `response.remoteAddress()` is the peer Chromium ACTUALLY reached. Watching
    // every response, rather than only the main navigation's, also covers subresources and
    // fetch()/XHR that the page's own JavaScript issues.
    let privateAddressHit: string | null = null;
    page.on('response', (response) => {
      const ip = response.remoteAddress?.()?.ip;
      if (!ip) return;
      const clean = ip.replace(/^\[|\]$/g, '');
      if (isBlockedAddress(clean) && !privateAddressHit) {
        privateAddressHit = `${response.url()} -> ${clean}`;
      }
    });

    let response;
    try {
      response = await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
      emit('render', 'info', `network idle after ${Date.now() - startTime}ms · ${requestCount} request(s) made by the page`);
    } catch (err) {
      if (blockedNavigation) throw new SsrfBlockedError(`Navigation to a private or reserved address was blocked (${blockedNavigation}).`);
      // "Network idle" can be slow or never come on busy sites (analytics, chat widgets, polling)
      // even though the page itself loaded. If it did load and answered successfully, analyse the
      // real DOM as it stands rather than discarding it for placeholder data.
      if (pageLoaded && mainResponse && mainResponse.status() < 400) {
        emit('render', 'warn', `the network did not go idle within ${Math.round(timeoutMs / 1000)}s, but the page had loaded: analysing the real DOM as it stands`);
        response = mainResponse;
      } else {
        throw err;
      }
    }
    if (blockedNavigation) throw new SsrfBlockedError(`Navigation to a private or reserved address was blocked (${blockedNavigation}).`);

    // Closes the DNS-rebinding gap the interception check cannot: Chromium
    // resolves hosts itself, so a name can pass the check and then resolve
    // privately for the real connection. remoteAddress() is the IP Chromium
    // actually connected to. Refuse the content if it is private.
    const remoteIp = response?.remoteAddress()?.ip;
    if (remoteIp && isBlockedAddress(remoteIp.replace(/^\[|\]$/g, ''))) {
      throw new SsrfBlockedError('The page was served from a private or reserved address.');
    }
    if (privateAddressHit) {
      throw new SsrfBlockedError(
        `A request made by the page reached a private or reserved address (${privateAddressHit}).`
      );
    }
    // Prefer the page's OWN navigation timing over our wall clock. `startTime` spans Chromium's
    // navigation setup plus our post-load `networkidle2` wait — neither is the target's
    // performance — and on a slow or remote scanning host the wall clock is dominated by that
    // host's network latency rather than the site. `ttfbMs` is kept separately so the report can
    // tell "the network is slow" apart from "the page is heavy".
    // A JavaScript challenge ("Just a moment...") clears itself once the browser has solved it and
    // reloads into the real page. Give it a bounded time (10 s) before reading anything, so the
    // page measured is the site and not the wait screen.
    if (/^(just a moment|checking your browser|one more step|verifying you are human)/i.test(await page.title().catch(() => ''))) {
      emit('render', 'info', 'a bot-check screen is showing: waiting up to 10s for it to clear');
      const cleared = await page
        .waitForFunction(() => !/^(just a moment|checking your browser|one more step|verifying you are human)/i.test(document.title), { timeout: 10000 })
        .then(() => true, () => false);
      if (cleared) {
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 4000 }).catch(() => {});
        if (mainResponse) response = mainResponse; // the status of the page it cleared into, not of the challenge
        emit('render', 'info', `the bot-check cleared after ${Date.now() - startTime}ms`);
      } else {
        emit('render', 'warn', 'the bot-check did not clear within 10s');
      }
    }

    const navTiming = await page
      .evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as
          | (PerformanceNavigationTiming & { responseStart: number })
          | undefined;
        if (!nav) return null;
        return {
          loadMs: Math.round(nav.loadEventEnd || nav.domContentLoadedEventEnd || 0),
          ttfbMs: Math.round(nav.responseStart || 0)
        };
      })
      .catch(() => null);

    const loadTimeMs = navTiming?.loadMs || Date.now() - startTime;
    const html = await page.content();
    // What a reader actually sees. Counting words from the markup also counts hidden menus,
    // aria-hidden duplicates and display:none blocks (Apple: 1510 words by markup, 893 visible).
    const visibleText = await page
      .evaluate(() => (document.body ? document.body.innerText : ''))
      .then((t) => (typeof t === 'string' ? t : undefined))
      .catch(() => undefined);

    const vitals = await page
      .evaluate(() => (window as any).__vitals as { lcp?: number; cls?: number } | undefined)
      .catch(() => undefined);
    const webVitals =
      vitals && (vitals.lcp !== undefined || typeof vitals.cls === 'number')
        ? {
            ...(vitals.lcp !== undefined && { lcpMs: Math.round(vitals.lcp) }),
            ...(typeof vitals.cls === 'number' && { cls: Math.round(vitals.cls * 1000) / 1000 })
          }
        : undefined;

    const chain = response?.request().redirectChain() ?? [];
    const redirectChain = [...chain.map((r) => r.url()), response?.url() ?? url];

    return {
      html,
      status: response?.status() ?? 200,
      ok: response ? response.ok() : true,
      loadTimeMs,
      ttfbMs: navTiming?.ttfbMs,
      headers: response?.headers() ?? {},
      redirectChain,
      webVitals,
      visibleText,
      transferKb: transferBytes > 0 ? Math.round(transferBytes / 102.4) / 10 : undefined,
      requestCount,
      userAgent
    };
  } finally {
    beatStop();
    await page.close();
  }
}

/**
 * Super lightweight, extremely fast regex-based HTML scanner
 * No external execution dependency, highly robust.
 */
// Regex tag-stripping leaves HTML entities encoded, so headings and titles reached the report as
// "Auth &amp; Session Flaws" — and the AI then echoed the mangled text back as a finding.
function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…'
  };
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (named[key] !== undefined) return named[key];

    const code = key.startsWith('#x')
      ? parseInt(key.slice(2), 16)
      : key.startsWith('#')
        ? parseInt(key.slice(1), 10)
        : NaN;

    if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return match;
  });
}

function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Words in a string of already-visible text. */
function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** True when `rel` (a space-separated token list) contains the token. */
function relHas(rel: string | undefined, token: string): boolean {
  return (rel || '').toLowerCase().split(/\s+/).includes(token);
}

/** Text between a start tag's end and its closing tag (or the next sibling start of the same tag, for unclosed ones). */
const BOUNDARY: Record<string, RegExp> = {};
function innerHtml(html: string, name: string, from: number): string {
  const re = (BOUNDARY[name] ??= new RegExp(`</?${name}(?=[\\s/>])`, 'gi'));
  re.lastIndex = from;
  const stop = re.exec(html);
  return html.slice(from, stop ? stop.index : html.length);
}

/**
 * `visibleText` is the browser's own innerText for the page. When it is available it is the source of
 * truth for the word count; without it (a plain HTML string) the markup is counted instead, minus the
 * elements the markup itself marks hidden.
 */
export function parsePage(url: string, html: string, loadTimeMs: number, ttfbMs?: number, visibleText?: string): CrawlPageData {
  // A browser with JavaScript on never shows <noscript> content, so headings, links and images
  // inside it are not part of the page being audited (they were being counted as duplicates).
  html = html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ');
  // JSON-LD lives in a <script>; everything else must be read with scripts, styles, templates and
  // comments removed, or markup quoted inside inline JSON / inert <template>s is counted as page
  // content (Craigslist: 451 "links" by regex, 258 real anchors in the live DOM).
  const withScripts = html;
  html = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const result: CrawlPageData = {
    url,
    loadTimeMs,
    ttfbMs,
    pageSizeKb: Math.round((withScripts.length / 1024) * 10) / 10,
    status: 200,
    isSimulated: false,
    meta: {
      title: '',
      description: '',
      keywords: '',
      viewport: '',
      robots: '',
      canonical: ''
    },
    headings: { h1: [], h2: [], h3: [] },
    images: { total: 0, missingAlt: 0, noAltAttribute: 0, emptyAlt: 0, lazyNoSrc: 0, list: [] },
    links: { total: 0, internal: 0, external: 0, list: [] },
    structuredData: { hasJsonLd: false, types: [] },
    lang: '',
    social: { ogTitle: '', ogDescription: '', ogImage: '', ogType: '', twitterCard: '' },
    hreflang: [],
    wordCount: 0
  };

  try {
    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      result.meta.title = cleanText(titleMatch[1]);
    }

    // Meta tags. Read through the attribute tokenizer: a double-quoted description may contain an
    // apostrophe ("GitHub is where the world's developers...") and a character-class regex stopped there.
    // The first tag of a key wins, as it does for document.querySelector. A tag may carry BOTH
    // name and property (GOV.UK: <meta name="title" property="og:title">), and each one is a key.
    const seenMeta = new Set<string>();
    const metaKeys = findTags(html, 'meta').flatMap(({ attrs }) =>
      attrs.content === undefined ? [] : [attrs.name, attrs.property].filter((k): k is string => !!k).map((k) => [k.toLowerCase(), attrs.content] as const));
    for (const [name, content] of metaKeys) {
      if (seenMeta.has(name)) continue;
      seenMeta.add(name);
      if (name === 'description') result.meta.description = content;
      if (name === 'keywords') result.meta.keywords = content;
      if (name === 'viewport') result.meta.viewport = content;
      if (name === 'robots') result.meta.robots = content;
      if (name === 'og:title') result.social!.ogTitle = content;
      if (name === 'og:description') result.social!.ogDescription = content;
      if (name === 'og:image') result.social!.ogImage = content;
      if (name === 'og:type') result.social!.ogType = content;
      if (name === 'twitter:card') result.social!.twitterCard = content;
    }

    // <html lang="...">
    const htmlTag = findTags(html, 'html')[0];
    if (htmlTag?.attrs.lang) result.lang = htmlTag.attrs.lang.trim();

    // <link> tags: hreflang alternates and the canonical (attribute order varies; each tag is read whole)
    for (const { attrs } of findTags(html, 'link')) {
      if (relHas(attrs.rel, 'canonical') && attrs.href !== undefined && !result.meta.canonical) result.meta.canonical = attrs.href;
      if (!relHas(attrs.rel, 'alternate') || attrs.hreflang === undefined || attrs.href === undefined) continue;
      // The list is a capped sample; the true number of alternates is kept apart so a report never quotes the cap.
      result.hreflangTotal = (result.hreflangTotal ?? 0) + 1;
      if (result.hreflang!.length < 50) result.hreflang!.push({ lang: attrs.hreflang.trim(), href: attrs.href.trim() });
    }

    // Visible word count. The browser's innerText is what a reader sees. The markup count is only a
    // fallback (plain HTML, no browser): it drops script/style blocks and elements the markup hides.
    if (visibleText !== undefined) {
      result.wordCount = countWords(visibleText);
    } else {
      const bodyTag = findTags(html, 'body')[0];
      const visible = stripHidden(bodyTag ? html.slice(bodyTag.end) : html).replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
      // Block tags become spaces (or "</h1><p>" would glue two words together) but inline tags do not
      // (or a page that wraps each letter in a <span> reads as hundreds of one-letter words).
      result.wordCount = countWords(tagsToText(visible));
    }

    // Headings
    const headingTexts = (tag: 'h1' | 'h2' | 'h3', into: string[]) => {
      for (const t of findTags(html, tag)) {
        const text = cleanText(innerHtml(html, tag, t.end));
        if (text) into.push(text);
      }
    };
    headingTexts('h1', result.headings.h1);
    headingTexts('h2', result.headings.h2);
    headingTexts('h3', result.headings.h3);

    // JSON-LD structured data.
    // Schema blocks are almost never a bare `{"@type": "..."}`. The standard shapes are
    // `{"@graph": [...]}` (Next.js, Yoast, Rank Math, most SEO plugins) and `"@type": ["A","B"]`,
    // and entity types are routinely nested inside properties (mainEntity, itemListElement, …).
    // Reading only the top level reported "zero declared @types" for a page that declared 16 of
    // them — which the AI then turned into confident "your structured data is functionally dead"
    // and "no FAQPage/HowTo/Organization schema anywhere" findings that were simply false.
    const collectLdTypes = (node: unknown, out: string[]): void => {
      if (Array.isArray(node)) {
        node.forEach((child) => collectLdTypes(child, out));
        return;
      }
      if (!node || typeof node !== 'object') return;

      const rawType = (node as Record<string, unknown>)['@type'];
      const declared = Array.isArray(rawType) ? rawType : [rawType];
      declared.forEach((t) => {
        if (typeof t === 'string' && t.trim() && !out.includes(t)) out.push(t);
      });

      Object.values(node as Record<string, unknown>).forEach((child) => collectLdTypes(child, out));
    };

    const jsonLdRegex = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(withScripts)) !== null) {
      result.structuredData.hasJsonLd = true;
      try {
        collectLdTypes(JSON.parse(jsonLdMatch[1].trim()), result.structuredData.types);
      } catch {
        // Malformed JSON-LD is the target site's problem; it must not fail the whole scan.
      }
    }

    // Images. alt="" is the valid way to mark a decorative image, so it is counted apart from an
    // image with no alt attribute at all (the real defect). `missingAlt` keeps its old meaning for
    // the scoring and the model, but is now only the no-attribute case.
    for (const { attrs } of findTags(html, 'img')) {
      const srcset = attrs.srcset || attrs['data-srcset'] || '';
      const lazySrc = attrs['data-src'] || attrs['data-lazy-src'] || srcset.trim().split(/[\s,]+/)[0] || '';
      const own = attrs.src || '';
      // A data: URI is a placeholder for the real, lazily loaded image.
      const src = own && !(lazySrc && /^data:/i.test(own)) ? own : lazySrc;
      if (!src) continue;
      if (lazySrc && (!own || /^data:/i.test(own))) result.images.lazyNoSrc!++;

      const alt = attrs.alt ?? '';
      const hasAlt = !!alt.trim();
      result.images.total++;
      if (attrs.alt === undefined) result.images.noAltAttribute!++;
      else if (!hasAlt) result.images.emptyAlt!++;

      // Cap visual list sizes to prevent huge payload
      if (result.images.list.length < 30) {
        result.images.list.push({ src, alt, hasAlt });
      }
    }
    result.images.missingAlt = result.images.noAltAttribute!;

    // Domain Parsing Helper
    let baseUrl;
    try {
      baseUrl = new URL(url);
    } catch {
      baseUrl = { origin: '', hostname: '' };
    }
    const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

    // Links parsing
    for (const a of findTags(html, 'a')) {
      const href = (a.attrs.href ?? '').trim();
      if (!href || href.startsWith('#') || /^(javascript|mailto|tel):/i.test(href)) continue;
      const linkText = cleanText(innerHtml(html, 'a', a.end)).slice(0, 50);

      let resolvedHref = href;
      let isInternal = false;
      try {
        const parsedHref = new URL(href, url);
        resolvedHref = parsedHref.toString();
        const host = bareHost(parsedHref.hostname);
        const base = bareHost(baseUrl.hostname);
        isInternal = /^https?:$/.test(parsedHref.protocol) && !!base && (host === base || host.endsWith('.' + base));
      } catch {
        isInternal = false;
      }

      result.links.total++;
      if (isInternal) {
        result.links.internal++;
      } else {
        result.links.external++;
      }

      if (result.links.list.length < 50) {
        result.links.list.push({
          href: resolvedHref,
          type: isInternal ? 'internal' : 'external',
          text: linkText || '[No Anchor Text]'
        });
      }
    }
  } catch (err) {
    console.error(`Error dissecting HTML content of url ${url}`, err);
  }

  return result;
}

/**
 * True when robots.txt closes the whole site to every crawler: the "*" group disallows "/" and no named
 * crawler group (Googlebot, Bingbot ...) grants any access. See robotsBlocksEveryone.
 */
export function robotsBlocksAll(robotsText: string): boolean {
  return robotsBlocksEveryone(robotsText);
}

export function securityHeadersFrom(headers: Record<string, string>, finalUrl: string): SecurityHeaders {
  const has = (name: string) => !!headers[name];
  return {
    https: finalUrl.toLowerCase().startsWith('https://'),
    hsts: has('strict-transport-security'),
    csp: has('content-security-policy'),
    cspReportOnly: has('content-security-policy-report-only'),
    xFrameOptions: has('x-frame-options') || /frame-ancestors/i.test(headers['content-security-policy'] || ''),
    xContentTypeOptions: /nosniff/i.test(headers['x-content-type-options'] || ''),
    referrerPolicy: has('referrer-policy')
  };
}

/** Values (case-insensitively equal, non-empty) shared by more than one page. */
export function findDuplicates(pages: CrawlPageData[], pick: (p: CrawlPageData) => string): DuplicateGroup[] {
  const byValue = new Map<string, { value: string; urls: string[] }>();
  for (const page of pages) {
    if (page.isSimulated) continue;
    const value = pick(page).trim();
    if (!value) continue;
    const key = value.toLowerCase();
    const group = byValue.get(key) ?? { value, urls: [] };
    group.urls.push(page.url);
    byValue.set(key, group);
  }
  return [...byValue.values()].filter((g) => g.urls.length > 1);
}

/** 404 / 410 / 5xx except 503 (a maintenance or bot-wall answer). 401, 403, 429, 999 and the like are NOT broken: they cannot be verified from here. */
export function isBrokenStatus(status: number): boolean {
  return status === 404 || status === 410 || (status >= 500 && status < 600 && status !== 503);
}

/**
 * Samples links from the main page and reports the ones that definitely fail. Deliberately
 * conservative — a false "broken link" is worse than a missed one:
 *  - only 404/410/5xx (not 503) and DNS failures count (401/403/429/503/999 are bot-walls or auth, not breakage);
 *  - timeouts and connection resets are ignored;
 *  - HEAD is retried as GET, since some servers reject HEAD outright.
 * Every request goes through safeFetch, so private destinations are refused like everywhere else.
 */
export async function checkLinks(
  links: CrawlPageData['links']['list'],
  limits = { internal: 15, external: 5 },
  budgetMs = 8000,
  onProbe?: (href: string, outcome: number | string) => void
): Promise<{ broken: BrokenLink[]; checked: number }> {
  const seen = new Set<string>();
  const sample: Array<{ href: string; type: 'internal' | 'external' }> = [];
  const taken = { internal: 0, external: 0 };
  for (const link of links) {
    // Hrefs stored by an older parser still carry entities ("?a=1&amp;b=2" is not the URL the browser requests).
    const href = decodeHtml(link.href).split('#')[0];
    if (!/^https?:\/\//i.test(href) || seen.has(href)) continue;
    if (taken[link.type] >= limits[link.type]) continue;
    seen.add(href);
    taken[link.type]++;
    sample.push({ href, type: link.type });
  }

  const broken: BrokenLink[] = [];
  let checked = 0;

  const probe = async (item: { href: string; type: 'internal' | 'external' }) => {
    try {
      let res = await safeFetch(item.href, { method: 'HEAD', timeoutMs: 3000, maxBytes: 1024 });
      if (res.status === 405 || res.status === 501 || res.status === 403) {
        res = await safeFetch(item.href, { method: 'GET', timeoutMs: 3000, maxBytes: 1024 });
      }
      // A failure is confirmed with one more GET before it is reported: a single 404/5xx can be a
      // HEAD-hostile server or a transient fault.
      if (isBrokenStatus(res.status)) res = await safeFetch(item.href, { method: 'GET', timeoutMs: 3000, maxBytes: 1024 });
      onProbe?.(item.href, isBrokenStatus(res.status) || res.status < 400 ? res.status : `${res.status} (could not be verified)`);
      // Bot walls answer 401/403/429/503/999 to a scanner and the real page to a browser: that is
      // "unverified", not "broken", and it is not counted as a link that was checked.
      if (res.status < 400 || isBrokenStatus(res.status)) checked++;
      if (isBrokenStatus(res.status)) {
        broken.push({ href: item.href, status: res.status, type: item.type });
      }
    } catch (err: any) {
      if (err instanceof SsrfBlockedError) {
        onProbe?.(item.href, 'skipped (private address)');
        return;
      }
      if (err?.code === 'ENOTFOUND') {
        checked++;
        onProbe?.(item.href, 'DNS failure');
        broken.push({ href: item.href, status: 0, type: item.type });
      } else {
        onProbe?.(item.href, 'no answer (not counted)');
      }
    }
  };

  // A wall-clock budget: link checking is a bonus, and must not hold up the audit on a slow link.
  // No new batch starts after the deadline; whatever was checked is reported as the sample size.
  const deadline = Date.now() + budgetMs;
  const CONCURRENCY = 8;
  for (let i = 0; i < sample.length && Date.now() < deadline; i += CONCURRENCY) {
    await Promise.all(sample.slice(i, i + CONCURRENCY).map(probe));
  }
  return { broken, checked };
}

/**
 * Logs what was actually measured on a parsed page, one line per finding, grouped by the same
 * stage ids the UI shows. Pure aside from `emit`, so it is unit-testable. Levels are factual:
 * `warn` means the value is absent or a known SEO problem; it never means "estimated".
 */
export function describePage(page: CrawlPageData, emit: Emit, headers?: SecurityHeaders): void {
  // ── meta ────────────────────────────────────────────────────────────────
  emit('meta', 'start', 'reading <head>');
  const { title, description, canonical, viewport, robots } = page.meta;
  emit('meta', title ? 'ok' : 'warn', title ? `title (${title.length} chars): "${clip(title, 70)}"` : 'title tag MISSING');
  emit('meta', description ? 'ok' : 'warn', description ? `meta description (${description.length} chars)` : 'meta description MISSING');
  emit('meta', canonical ? 'ok' : 'info', canonical ? `canonical → ${clip(canonical, 80)}` : 'no canonical link declared');
  emit('meta', viewport ? 'ok' : 'warn', viewport ? `viewport: ${clip(viewport, 60)}` : 'viewport meta MISSING (mobile rendering)');
  if (/noindex/i.test(robots)) emit('meta', 'warn', `robots meta "${clip(robots, 40)}" — this page asks to be excluded from search`);
  else emit('meta', 'ok', robots ? `robots meta: ${clip(robots, 40)}` : 'robots meta: none (indexable by default)');
  if (page.lang !== undefined) emit('meta', page.lang ? 'ok' : 'warn', page.lang ? `<html lang="${clip(page.lang, 12)}">` : '<html lang> MISSING');
  if (page.social) {
    const s = page.social;
    const og = [['title', s.ogTitle], ['description', s.ogDescription], ['image', s.ogImage]] as const;
    const missing = og.filter(([, v]) => !v).map(([k]) => k);
    emit('meta', missing.length ? 'warn' : 'ok', missing.length ? `Open Graph missing: ${missing.join(', ')}` : 'Open Graph: title, description, image present');
    emit('meta', s.twitterCard ? 'ok' : 'info', s.twitterCard ? `twitter:card = ${clip(s.twitterCard, 30)}` : 'no twitter:card tag');
  }
  if (page.hreflang) emit('meta', 'info', page.hreflang.length ? `hreflang: ${page.hreflang.length} alternate language link(s)` : 'hreflang: none (fine for a single-language site)');
  emit('meta', 'done', title ? 'title + description read' : 'head read, gaps found');

  // ── headings & content ──────────────────────────────────────────────────
  emit('headings', 'start', 'walking the heading tree');
  const h = page.headings;
  emit('headings', h.h1.length ? 'ok' : 'warn', h.h1.length ? `H1 ×${h.h1.length}: "${clip(h.h1[0], 60)}"` : 'no H1 heading found');
  emit('headings', 'info', `H2 ×${h.h2.length} · H3 ×${h.h3.length}`);
  if (typeof page.wordCount === 'number') {
    emit('headings', page.wordCount < 300 ? 'warn' : 'ok', `${page.wordCount} visible words${page.wordCount < 300 ? ' (thin: under 300)' : ''}`);
  }
  emit('headings', 'done', `${h.h1.length + h.h2.length + h.h3.length} headings`);

  // ── images ──────────────────────────────────────────────────────────────
  emit('images', 'start', 'scanning <img> tags');
  const im = page.images;
  const noAttr = im.noAltAttribute ?? im.missingAlt;
  emit('images', noAttr ? 'warn' : 'ok', `${im.total} image(s), ${noAttr} without alt text${im.emptyAlt ? `, ${im.emptyAlt} with empty alt (decorative, valid)` : ''}${im.lazyNoSrc ? `, ${im.lazyNoSrc} lazy-loaded (real source in data-src/srcset)` : ''}`);
  emit('images', 'done', `${noAttr}/${im.total} no alt attribute`);

  // ── links (structure; the broken-link probe logs separately) ────────────
  emit('links', 'start', 'mapping links');
  emit('links', 'ok', `${page.links.total} link(s): ${page.links.internal} internal, ${page.links.external} external`);

  // ── structured data ─────────────────────────────────────────────────────
  emit('schema', 'start', 'parsing JSON-LD blocks');
  const sd = page.structuredData;
  emit('schema', sd.types.length ? 'ok' : 'warn', sd.types.length ? `${sd.types.length} schema.org type(s): ${clip(sd.types.slice(0, 8).join(', '), 90)}` : sd.hasJsonLd ? 'JSON-LD present but no @type could be read' : 'no JSON-LD structured data found');
  emit('schema', 'done', sd.types.length ? `${sd.types.length} types` : 'none');

  // ── security headers ────────────────────────────────────────────────────
  if (headers) {
    emit('security', 'start', 'checking response headers');
    const checks: Array<[string, boolean]> = [
      ['HTTPS', headers.https], ['Strict-Transport-Security', headers.hsts], ['Content-Security-Policy', headers.csp],
      ['X-Frame-Options / frame-ancestors', headers.xFrameOptions], ['X-Content-Type-Options: nosniff', headers.xContentTypeOptions],
      ['Referrer-Policy', headers.referrerPolicy]
    ];
    for (const [name, ok] of checks) emit('security', ok ? 'ok' : 'warn', `${name}: ${ok ? 'present' : 'MISSING'}`);
    const missing = checks.filter(([, ok]) => !ok).length;
    emit('security', 'done', missing ? `${missing} of ${checks.length} missing` : 'all present');
  }

  // ── performance ─────────────────────────────────────────────────────────
  emit('perf', 'start', 'reading navigation timing');
  emit('perf', 'ok', `load ${page.loadTimeMs}ms${page.ttfbMs !== undefined ? ` · TTFB ${page.ttfbMs}ms` : ''} · ${page.pageSizeKb}KB HTML`);
  if (page.webVitals && (page.webVitals.lcpMs !== undefined || page.webVitals.cls !== undefined)) {
    const { lcpMs, cls } = page.webVitals;
    emit('perf', (lcpMs ?? 0) > 2500 || (cls ?? 0) > 0.1 ? 'warn' : 'ok',
      `lab vitals (from the scanning host, not real users): ${lcpMs !== undefined ? `LCP ${lcpMs}ms` : ''}${lcpMs !== undefined && cls !== undefined ? ' · ' : ''}${cls !== undefined ? `CLS ${cls}` : ''}`);
  } else {
    emit('perf', 'info', 'browser reported no LCP/CLS entries');
  }
  emit('perf', 'done', `${page.loadTimeMs}ms load`);
}

const PARSE_STAGES = ['meta', 'headings', 'images', 'links', 'schema', 'security', 'perf'];

export async function crawlUrl(targetUrl: string, mode: ScanMode, depth: number, emit: Emit = noopEmit): Promise<CrawlResult> {
  const formattedUrl = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;
  // Refused outright — never a "simulated" report. An internal address is not
  // an unreachable site to paper over with placeholder data; it is a request
  // this server must not make. Throws SsrfBlockedError, which the routes turn
  // into a 400.
  emit('url', 'start', `resolving ${clip(targetUrl, 80)}`);
  let originUrl: URL;
  try {
    originUrl = await assertPublicUrl(formattedUrl);
  } catch (err: any) {
    emit('url', 'fail', err instanceof SsrfBlockedError ? `refused: ${err.message}` : `could not resolve target: ${clip(err?.message, 120)}`);
    throw err;
  }
  emit('url', 'ok', `${originUrl.hostname} resolves to a public address (SSRF guard passed)`);
  emit('url', 'done', originUrl.origin);

  const result: CrawlResult = {
    rootUrl: originUrl.toString(),
    mode,
    depth,
    timestamp: new Date().toISOString(),
    mainPage: null as any,
    additionalPages: [],
    sitemapFound: false,
    llmsTxtFound: false,
    hasSimulatedData: false
  };

  // Step 1: robots.txt -> sitemap, and /llms.txt. Independent of each other, so they run
  // concurrently; on a slow link the sequential version cost several seconds per scan.
  // robots.txt text, kept for the crawler-access test: null = unreadable, '' = none published (everything allowed).
  let robotsText: string | null = null;
  const robotsAndSitemap = (async () => {
    emit('robots', 'start', 'GET /robots.txt');
    let sitemapLoc = `${originUrl.origin}/sitemap.xml`;
    try {
      const robotsRes = await safeFetch(`${originUrl.origin}/robots.txt`, { timeoutMs: 4000, maxBytes: 512 * 1024 });
      if (robotsRes.ok) {
        const text = robotsRes.text;
        robotsText = text;
        emit('robots', 'ok', `/robots.txt → ${robotsRes.status} (${text.length} bytes)`);
        result.robotsBlocksAll = robotsBlocksAll(text);
        result.robotsByCrawler = Object.fromEntries(BOTS.map((b) => [b.name, robotsAccess(text, b.token)]));
        if (result.robotsBlocksAll) emit('robots', 'warn', 'site-wide "Disallow: /" for all crawlers — nothing on this site can be indexed');
        else emit('robots', 'ok', 'no site-wide block for crawlers');
        const sitemapLine = text.split('\n').find(line => line.toLowerCase().startsWith('sitemap:'));
        if (sitemapLine) {
          sitemapLoc = sitemapLine.split(/sitemap:/i)[1].trim();
          emit('robots', 'info', `Sitemap directive → ${clip(sitemapLoc, 90)}`);
        } else {
          emit('robots', 'info', 'no Sitemap: directive; falling back to /sitemap.xml');
        }
        result.robotsReadable = true;
      } else if (robotsRes.status === 404 || robotsRes.status === 410) {
        // Only "not found / gone" means the site publishes no rules (everything allowed).
        robotsText = '';
        result.robotsReadable = true;
        emit('robots', 'info', `/robots.txt → ${robotsRes.status} (no crawl rules published, so all crawlers are allowed)`);
      } else {
        // 401/403/406/418/429/5xx: the site refused or failed. Its rules are unknown, not absent.
        result.robotsReadable = false;
        emit('robots', 'warn', `/robots.txt could not be read: HTTP ${robotsRes.status} (the site refused or failed this request, so its crawl rules are unknown)`);
      }
    } catch (err: any) {
      result.robotsReadable = false;
      emit('robots', 'warn', `/robots.txt could not be read: ${clip(err?.message, 100)}`);
    }

    // Double check sitemap presence
    emit('robots', 'info', `GET ${clip(sitemapLoc, 90)}`);
    try {
      // The sitemap location comes from the TARGET's robots.txt, so it is
      // attacker-controlled: "Sitemap: http://10.0.0.5:6379/" would otherwise
      // have this server probe an internal port and report back whether it
      // answered (sitemapFound). safeFetch refuses private destinations.
      const sitemapRes = await safeFetch(sitemapLoc, { timeoutMs: 3000, maxBytes: 5 * 1024 * 1024 });
      if (sitemapRes.ok) {
        result.sitemapFound = true;
        result.sitemapUrl = sitemapLoc;
        result.sitemapChecked = true;
        emit('robots', 'ok', `sitemap → ${sitemapRes.status} found`);
      } else if ((sitemapRes.status === 404 || sitemapRes.status === 410) && result.robotsReadable) {
        result.sitemapChecked = true;
        emit('robots', 'warn', `sitemap → ${sitemapRes.status} not found`);
      } else {
        // Refused/failed, or a 404 at the default path while robots.txt (which may name another location) was unreadable.
        result.sitemapChecked = false;
        emit('robots', 'warn', `sitemap could not be checked: HTTP ${sitemapRes.status}${result.robotsReadable ? '' : ' (robots.txt, which may name it, was unreadable too)'}`);
      }
    } catch (err: any) {
      result.sitemapChecked = false;
      emit('robots', 'warn', `sitemap could not be checked: ${clip(err?.message, 100)}`);
    }
    emit('robots', 'done', result.sitemapFound ? 'sitemap found' : result.sitemapChecked ? 'no sitemap' : 'sitemap could not be checked');
  })();

  // Check for /llms.txt. The report used to assert "no llms.txt / no AI-crawler directives"
  // without ever looking, which produced confident findings about a file that often exists.
  const llmsCheck = (async () => {
    emit('llms', 'start', 'GET /llms.txt');
    try {
      const llmsRes = await safeFetch(`${originUrl.origin}/llms.txt`, { timeoutMs: 3000, maxBytes: 512 * 1024 });
      result.llmsTxtFound = llmsRes.ok;
      result.llmsChecked = llmsRes.ok || llmsRes.status === 404 || llmsRes.status === 410;
      if (llmsRes.ok) emit('llms', 'ok', `/llms.txt → ${llmsRes.status} present (${llmsRes.text.length} bytes)`);
      else if (result.llmsChecked) emit('llms', 'info', `/llms.txt → ${llmsRes.status} not published`);
      else emit('llms', 'info', `/llms.txt could not be read: HTTP ${llmsRes.status} (the site refused or failed this request, so it is unknown whether the file exists)`);
    } catch (err: any) {
      result.llmsChecked = false;
      emit('llms', 'info', `/llms.txt could not be read: ${clip(err?.message, 100)}`);
    }
  })();
  await Promise.all([robotsAndSitemap, llmsCheck]);

  // Step 2: Render and Analyze Root Page (real browser — captures JS-rendered content)
  emit('render', 'start', 'launching a headless Chromium page');
  let realPage = false;
  try {
    emit('render', 'info', `navigating to ${clip(originUrl.toString(), 80)} (wait for network idle, 15s timeout)`);
    let rendered = await renderPage(originUrl.toString(), 15000, emit);
    // A refusal or bot wall may be specific to one client identity (Canva wants a Chrome token,
    // W3C challenges Chrome-looking agents but accepts ours). Try ONE other honest browser identity
    // before giving up on the page; we never present ourselves as a search-engine crawler.
    const wallOf = (r: RenderedPage) => {
      const p = parsePage(originUrl.toString(), r.html, r.loadTimeMs, r.ttfbMs, r.visibleText);
      return classifyChallenge({ status: r.status, title: p.meta.title, h1: p.headings.h1, bodyText: r.visibleText ?? '', robots: p.meta.robots });
    };
    const firstWall = wallOf(rendered);
    if (firstWall || [401, 403, 406, 429, 503].includes(rendered.status)) {
      emit('render', 'warn', `${firstWall ? 'bot challenge' : `HTTP ${rendered.status}`} on the first request: trying once more with a standard browser identity`);
      try {
        const second = await renderPage(originUrl.toString(), 15000, emit, RETRY_USER_AGENT);
        if (!wallOf(second) && (second.ok || !rendered.ok)) {
          rendered = second;
          emit('render', 'ok', 'the second identity received the real page');
        } else {
          emit('render', 'warn', 'the second identity was refused or challenged too: keeping the first answer');
        }
      } catch (err) {
        if (err instanceof SsrfBlockedError) throw err;
        emit('render', 'info', `the second attempt failed (${clip((err as Error)?.message, 80)}): keeping the first answer`);
      }
    }
    const hops =rendered.redirectChain.length - 1;
    emit('render', rendered.ok ? 'ok' : 'warn', `HTTP ${rendered.status} · DOM captured (${Math.round((rendered.html.length / 1024) * 10) / 10}KB)`);
    emit('render', hops > 0 ? (hops > 2 ? 'warn' : 'info') : 'ok', hops > 0 ? `${hops} redirect hop(s): ${rendered.redirectChain.map((u) => clip(u, 50)).join(' → ')}` : 'no redirects');

    // Is this the site, or a bot wall standing in front of it? Judged from the page as received,
    // before anything is measured, so the report can say so instead of auditing the wall.
    const probe = rendered.ok ? null : parsePage(originUrl.toString(), rendered.html, rendered.loadTimeMs, rendered.ttfbMs, rendered.visibleText);
    const noteChallenge = (p: CrawlPageData) => {
      const reason = classifyChallenge({
        status: rendered.status, title: p.meta.title, h1: p.headings.h1,
        bodyText: rendered.visibleText ?? '', robots: p.meta.robots
      });
      result.pageKind = reason ? 'challenge' : 'normal';
      if (reason) {
        result.challengeReason = reason;
        emit('render', 'warn', `this looks like a bot challenge or blocked page, not the site itself (${reason}): the figures below describe that page`);
      }
    };
    if (probe) noteChallenge(probe);

    if (!rendered.ok) {
      // Target responded with a non-OK status (e.g. 403/404/500). We still don't have real page
      // content to parse, so fall back to simulated data — flagged via isSimulated.
      emit('render', 'fail', `page answered ${rendered.status}: no usable content, so PLACEHOLDER data is used and the report will be flagged as simulated`);
      result.mainPage = createMockPage(originUrl.toString(), rendered.status, rendered.loadTimeMs);
    } else {
      result.mainPage = parsePage(originUrl.toString(), rendered.html, rendered.loadTimeMs, rendered.ttfbMs, rendered.visibleText);
      noteChallenge(result.mainPage);
      result.mainPage.status = rendered.status;
      result.mainPage.webVitals = rendered.webVitals;
      result.mainPage.transferKb = rendered.transferKb;
      result.mainPage.requestCount = rendered.requestCount;
      result.redirectChain = rendered.redirectChain;
      result.redirectHops = rendered.redirectChain.length - 1; // the chain lists the start URL too: N URLs = N-1 hops
      result.securityHeaders = securityHeadersFrom(rendered.headers, rendered.redirectChain[rendered.redirectChain.length - 1]);
      realPage = true;
      // Measured evidence the report is checked against: raw vs rendered content, structured-data
      // contents, visible sections, and crawler access. Never allowed to fail the scan.
      try {
        result.facts = await collectFacts({
          url: originUrl.toString(),
          origin: originUrl.origin,
          robotsText,
          renderedHtml: rendered.html,
          renderedText: rendered.visibleText,
          renderedStatus: rendered.status,
          userAgent: rendered.userAgent,
          hreflangCount: result.mainPage.hreflangTotal ?? result.mainPage.hreflang?.length ?? 0,
          emit
        });
      } catch (err: any) {
        emit('render', 'info', `evidence collection skipped: ${clip(err?.message, 90)}`);
      }
    }
  } catch (err: any) {
    // A redirect or rebinding into a private address surfaces here. Propagate
    // it: dressing it up as a simulated report would hide the attempt.
    if (err instanceof SsrfBlockedError) {
      emit('render', 'fail', `blocked: ${err.message}`);
      throw err;
    }
    console.warn(`Render failed for ${originUrl.toString()}: ${err?.message}. Falling back to simulated placeholder data — this scan will NOT reflect the real site.`);
    emit('render', 'fail', `render failed: ${clip(err?.message, 120)} — PLACEHOLDER data is used and the report will be flagged as simulated`);

    // Fallback only: the target could not actually be reached (offline, DNS, CORS/firewall, timeout).
    // This data is fabricated so the UI has something to render, but callers MUST check
    // CrawlResult.hasSimulatedData / CrawlPageData.isSimulated before treating it as a real audit.
    const delay = Math.floor(Math.random() * 400 + 150);
    result.mainPage = createMockPage(originUrl.toString(), 200, delay);
  }
  emit('render', 'done', realPage ? `HTTP ${result.mainPage.status}` : 'failed, simulated');
  const blocked = result.facts?.botAccess?.results.filter((r) => r.blocked).length ?? 0;
  emit('llms', 'done', blocked ? `${blocked} crawler(s) refused` : result.llmsTxtFound ? 'llms.txt present' : 'no llms.txt');

  if (realPage) {
    describePage(result.mainPage, emit, result.securityHeaders);
  } else {
    for (const stage of PARSE_STAGES) {
      emit(stage, 'warn', 'skipped: the page could not be read, so there is nothing real to analyse');
      emit(stage, 'done', 'skipped');
    }
  }

  // Step 3: Deep Crawling of Additional Pages (Full Site Mode)
  if (mode === 'FULL_SITE' && depth > 1 && result.mainPage.links.list.length > 0) {
    // Find internal URLs to scan (up to depth - 1 pages, cap at 4 pages maximum to comply with speed guarantees of PDF delivery)
    const candidates = result.mainPage.links.list
      .filter(l => l.type === 'internal' && l.href !== originUrl.toString() && l.href !== `${originUrl.toString()}/`)
      .map(l => l.href);

    const uniqueCandidates = Array.from(new Set(candidates)).slice(0, Math.min(depth + 1, 4));
    emit('links', 'info', `deep crawl: rendering ${uniqueCandidates.length} additional internal page(s)`);

    for (const [n, linkUrl] of uniqueCandidates.entries()) {
      try {
        emit('links', 'info', `page ${n + 1}/${uniqueCandidates.length}: ${clip(linkUrl, 80)}`);
        const rendered = await renderPage(linkUrl, 10000);
        if (rendered.ok) {
          const page = parsePage(linkUrl, rendered.html, rendered.loadTimeMs, rendered.ttfbMs, rendered.visibleText);
          result.additionalPages.push(page);
          emit('links', 'ok', `HTTP ${rendered.status} · ${page.wordCount ?? 0} words · ${page.headings.h1.length} H1 · title "${clip(page.meta.title, 50)}"`);
        } else {
          result.additionalPages.push(createMockPage(linkUrl, rendered.status, rendered.loadTimeMs));
          emit('links', 'warn', `HTTP ${rendered.status}: page skipped (placeholder data, flagged simulated)`);
        }
      } catch (err) {
        // A subpage link into a private address is skipped, not faked — the
        // target's HTML chooses these links, so this is expected hostile input.
        if (err instanceof SsrfBlockedError) {
          emit('links', 'warn', `skipped ${clip(linkUrl, 60)}: private address blocked`);
          continue;
        }
        result.additionalPages.push(createMockPage(linkUrl, 200, Math.floor(Math.random() * 200 + 100)));
        emit('links', 'warn', `could not render ${clip(linkUrl, 60)}: placeholder data used (flagged simulated)`);
      }
    }
  }

  // Post-crawl checks that need the finished page set. Skipped for placeholder data: probing links
  // that were invented would report fabricated breakage.
  if (realPage) {
    try {
      emit('links', 'start', 'probing sampled links for 404 / 410 / 5xx (time-boxed to 8s)');
      const { broken, checked } = await checkLinks(result.mainPage.links.list, undefined, undefined, (href, outcome) => {
        emit('links', typeof outcome === 'number' && (outcome === 404 || outcome === 410 || outcome >= 500) ? 'warn' : 'info', `${typeof outcome === 'number' ? outcome : outcome} ${clip(href, 80)}`);
      });
      result.brokenLinks = broken;
      result.linksChecked = checked;
      emit('links', broken.length ? 'warn' : 'ok', `${checked} link(s) checked (a sample, not the whole site): ${broken.length} broken`);
    } catch (err) {
      console.warn('Link check failed:', err);
      emit('links', 'warn', 'link probe failed and was skipped');
    }
  } else {
    emit('links', 'warn', 'link probe skipped: no real page to take links from');
  }
  emit('links', 'done', result.brokenLinks ? `${result.brokenLinks.length} broken in sample` : 'probe skipped');

  if (result.additionalPages.length > 0) {
    const pages = [result.mainPage, ...result.additionalPages];
    result.duplicateTitles = findDuplicates(pages, (p) => p.meta.title);
    result.duplicateDescriptions = findDuplicates(pages, (p) => p.meta.description);
    emit('meta', result.duplicateTitles.length ? 'warn' : 'ok', result.duplicateTitles.length
      ? `${result.duplicateTitles.length} title(s) shared by several crawled pages`
      : `all ${pages.length} crawled titles are unique`);
  }

  result.hasSimulatedData = result.mainPage.isSimulated === true ||
    result.additionalPages.some(p => p.isSimulated === true);

  return result;
}

function createMockPage(urlString: string, status: number, loadTime: number): CrawlPageData {
  let hostname = 'demo.com';
  try {
    hostname = new URL(urlString).hostname;
  } catch {}

  const rootName = hostname.split('.')[0];
  const capitalizedName = rootName.charAt(0).toUpperCase() + rootName.slice(1);

  return {
    url: urlString,
    loadTimeMs: loadTime,
    pageSizeKb: Math.floor(Math.random() * 80 + 25),
    status,
    isSimulated: true,
    meta: {
      title: `${capitalizedName} | Leading Solutions & Professional Services`,
      description: `Welcome to ${capitalizedName}. We offer premium, elite software features, tailored business development, and dynamic SEO analysis with expert performance models built for 2026.`,
      keywords: `${rootName}, professional SEO audits, ${rootName} services, custom design`,
      viewport: 'width=device-width, initial-scale=1.0',
      robots: 'index, follow',
      canonical: urlString
    },
    headings: {
      h1: [`Transform Your Business Strategy with ${capitalizedName}`],
      h2: [
        `Our Custom Solutions Suite`,
        `Client Success Metrics & SEO Progress`,
        `Frequently Asked Questions`
      ],
      h3: [
        `High-Performance Analytics Modules`,
        `AEO & Generative Search Fine-Tuning`,
        `Connect with our Engineers`
      ]
    },
    images: {
      total: 14,
      missingAlt: 3,
      list: [
        { src: '/images/hero.webp', alt: `Enterprise product background for ${capitalizedName}`, hasAlt: true },
        { src: '/images/features/chart.svg', alt: 'Analytics and growth charts', hasAlt: true },
        { src: '/images/team/member.webp', alt: '', hasAlt: false },
        { src: '/images/logo.png', alt: `${capitalizedName} Corporate Brand`, hasAlt: true }
      ]
    },
    links: {
      total: 28,
      internal: 19,
      external: 9,
      list: [
        { href: `${urlString}/about`, type: 'internal', text: 'About Us' },
        { href: `${urlString}/services`, type: 'internal', text: 'Solutions' },
        { href: `${urlString}/contact`, type: 'internal', text: 'Book Consultation' },
        { href: `https://twitter.com/${rootName}`, type: 'external', text: 'Twitter Updates' },
        { href: 'https://github.com/project', type: 'external', text: 'Development Source' }
      ]
    },
    structuredData: {
      hasJsonLd: true,
      types: ['Organization', 'WebSite', 'LocalBusiness']
    }
  };
}
