import { CrawlPageData, CrawlResult, ScanMode } from '../src/types';

/**
 * Super lightweight, extremely fast regex-based HTML scanner
 * No external execution dependency, highly robust.
 */
function cleanText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function parsePage(url: string, html: string, loadTimeMs: number): CrawlPageData {
  const result: CrawlPageData = {
    url,
    loadTimeMs,
    pageSizeKb: Math.round((html.length / 1024) * 10) / 10,
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
    images: { total: 0, missingAlt: 0, list: [] },
    links: { total: 0, internal: 0, external: 0, list: [] },
    structuredData: { hasJsonLd: false, types: [] }
  };

  try {
    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      result.meta.title = cleanText(titleMatch[1]);
    }

    // Decoupled meta extractors for reliability
    const metaRegex = /<meta\s+([^>]*?)>/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      const metaAttributes = match[1];
      const nameMatch = metaAttributes.match(/name\s*=\s*["']([^"']*)["']/i) || metaAttributes.match(/property\s*=\s*["']([^"']*)["']/i);
      const contentMatch = metaAttributes.match(/content\s*=\s*["']([^"']*)["']/i);

      if (nameMatch && contentMatch) {
        const name = nameMatch[1].toLowerCase();
        const content = contentMatch[1];
        if (name === 'description') result.meta.description = content;
        if (name === 'keywords') result.meta.keywords = content;
        if (name === 'viewport') result.meta.viewport = content;
        if (name === 'robots') result.meta.robots = content;
      }
    }

    // Canonical link
    const canonicalMatch = html.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']*)["']/i) ||
                         html.match(/<link[^>]+href\s*=\s*["']([^"']*)["'][^>]+rel\s*=\s*["']canonical["']/i);
    if (canonicalMatch) {
      result.meta.canonical = canonicalMatch[1];
    }

    // Headings
    const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    let h1Match;
    while ((h1Match = h1Regex.exec(html)) !== null) {
      const t = cleanText(h1Match[1]);
      if (t) result.headings.h1.push(t);
    }

    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let h2Match;
    while ((h2Match = h2Regex.exec(html)) !== null) {
      const t = cleanText(h2Match[1]);
      if (t) result.headings.h2.push(t);
    }

    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let h3Match;
    while ((h3Match = h3Regex.exec(html)) !== null) {
      const t = cleanText(h3Match[1]);
      if (t) result.headings.h3.push(t);
    }

    // JSON-LD structured data
    const jsonLdRegex = /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonLdMatch;
    while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
      result.structuredData.hasJsonLd = true;
      try {
        const json = JSON.parse(jsonLdMatch[1].trim());
        const types = Array.isArray(json) ? json.map(j => j['@type']) : [json['@type']];
        types.forEach(type => {
          if (type && typeof type === 'string' && !result.structuredData.types.includes(type)) {
            result.structuredData.types.push(type);
          }
        });
      } catch (e) {
        // Log or bypass JSON validation issues
      }
    }

    // Images
    const imgRegex = /<img\s+([^>]*?)>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgAttrs = imgMatch[1];
      const srcMatch = imgAttrs.match(/src\s*=\s*["']([^"']*)["']/i);
      const altMatch = imgAttrs.match(/alt\s*=\s*["']([^"']*)["']/i);

      if (srcMatch) {
        const src = srcMatch[1];
        const alt = altMatch ? altMatch[1] : '';
        const hasAlt = !!alt.trim();
        result.images.total++;
        if (!hasAlt) result.images.missingAlt++;
        
        // Cap visual list sizes to prevent huge payload
        if (result.images.list.length < 30) {
          result.images.list.push({ src, alt, hasAlt });
        }
      }
    }

    // Domain Parsing Helper
    let baseUrl;
    try {
      baseUrl = new URL(url);
    } catch {
      baseUrl = { origin: '', hostname: '' };
    }

    // Links parsing
    const linkRegex = /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const linkAttrs = linkMatch[1];
      const linkText = cleanText(linkMatch[2]).slice(0, 50);
      const hrefMatch = linkAttrs.match(/href\s*=\s*["']([^"']*)["']/i);

      if (hrefMatch) {
        const href = hrefMatch[1].trim();
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          continue;
        }

        let resolvedHref = href;
        let isInternal = false;

        if (href.startsWith('/') || href.startsWith('.')) {
          resolvedHref = resolvedHref.startsWith('/') 
            ? `${baseUrl.origin}${href}` 
            : new URL(href, url).toString();
          isInternal = true;
        } else {
          try {
            const parsedHref = new URL(href);
            isInternal = parsedHref.hostname === baseUrl.hostname || parsedHref.hostname.endsWith('.' + baseUrl.hostname);
          } catch {
            isInternal = false;
          }
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
    }
  } catch (err) {
    console.error(`Error dissecting HTML content of url ${url}`, err);
  }

  return result;
}

export async function crawlUrl(targetUrl: string, mode: ScanMode, depth: number): Promise<CrawlResult> {
  const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  let originUrl: URL;
  try {
    originUrl = new URL(formattedUrl);
  } catch (err) {
    throw new Error(`Invalid URL parsed: ${targetUrl}`);
  }

  const result: CrawlResult = {
    rootUrl: originUrl.toString(),
    mode,
    depth,
    timestamp: new Date().toISOString(),
    mainPage: null as any,
    additionalPages: [],
    sitemapFound: false,
    hasSimulatedData: false
  };

  // Step 1: Query robots.txt & Find Sitemap
  let sitemapLoc = `${originUrl.origin}/sitemap.xml`;
  try {
    const robotsRes = await fetch(`${originUrl.origin}/robots.txt`, { signal: AbortSignal.timeout(4000) });
    if (robotsRes.ok) {
      const text = await robotsRes.text();
      const sitemapLine = text.split('\n').find(line => line.toLowerCase().startsWith('sitemap:'));
      if (sitemapLine) {
        sitemapLoc = sitemapLine.split(/sitemap:/i)[1].trim();
      }
    }
  } catch (err) {
    // robots.txt missing represents standard workflow
  }

  // Double check sitemap presence
  try {
    const sitemapRes = await fetch(sitemapLoc, { signal: AbortSignal.timeout(3000) });
    if (sitemapRes.ok) {
      result.sitemapFound = true;
      result.sitemapUrl = sitemapLoc;
    }
  } catch {
    // sitemap not found
  }

  // Step 2: Fetch and Analyze Root Page
  const startTime = Date.now();
  try {
    const targetResponse = await fetch(originUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEO-Scan-Pro/1.1' },
      signal: AbortSignal.timeout(10000)
    });
    const loadTime = Date.now() - startTime;

    if (!targetResponse.ok) {
      // Target responded with a non-OK status (e.g. 403/404/500). We still don't have real page
      // content to parse, so fall back to simulated data — flagged via isSimulated.
      result.mainPage = createMockPage(originUrl.toString(), targetResponse.status, loadTime);
    } else {
      const htmlText = await targetResponse.text();
      result.mainPage = parsePage(originUrl.toString(), htmlText, loadTime);
    }
  } catch (err: any) {
    console.warn(`Fetch failed for ${originUrl.toString()}: ${err?.message}. Falling back to simulated placeholder data — this scan will NOT reflect the real site.`);

    // Fallback only: the target could not actually be reached (offline, DNS, CORS/firewall, timeout).
    // This data is fabricated so the UI has something to render, but callers MUST check
    // CrawlResult.hasSimulatedData / CrawlPageData.isSimulated before treating it as a real audit.
    const delay = Math.floor(Math.random() * 400 + 150);
    result.mainPage = createMockPage(originUrl.toString(), 200, delay);
  }

  // Step 3: Deep Crawling of Additional Pages (Full Site Mode)
  if (mode === 'FULL_SITE' && depth > 1 && result.mainPage.links.list.length > 0) {
    // Find internal URLs to scan (up to depth - 1 pages, cap at 4 pages maximum to comply with speed guarantees of PDF delivery)
    const candidates = result.mainPage.links.list
      .filter(l => l.type === 'internal' && l.href !== originUrl.toString() && l.href !== `${originUrl.toString()}/`)
      .map(l => l.href);
    
    const uniqueCandidates = Array.from(new Set(candidates)).slice(0, Math.min(depth + 1, 4));

    for (const linkUrl of uniqueCandidates) {
      const pageStartTime = Date.now();
      try {
        const subRes = await fetch(linkUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SEO-Scan-Pro/1.1' },
          signal: AbortSignal.timeout(4000)
        });
        const delay = Date.now() - pageStartTime;
        if (subRes.ok) {
          const text = await subRes.text();
          result.additionalPages.push(parsePage(linkUrl, text, delay));
        } else {
          result.additionalPages.push(createMockPage(linkUrl, subRes.status, delay));
        }
      } catch {
        result.additionalPages.push(createMockPage(linkUrl, 200, Math.floor(Math.random() * 200 + 100)));
      }
    }
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
