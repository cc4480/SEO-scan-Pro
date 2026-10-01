import { getBrowser } from '../browser';
import { browserRequestAllowed } from '../ssrfGuard';

// A normal browser identity, so the page is measured as it is served to everyone, not to a scanner.
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export interface NoJsMeasure {
  status: number;
  title: string;
  h1: string[];
  /** innerText of the page loaded with JavaScript switched off: what is readable without scripts. */
  text: string;
  /** a[href] that are real links (not '#', javascript:, mailto:, tel:). */
  links: number;
}

/**
 * Loads the page in a real browser with JavaScript DISABLED and reads what is visible. A regex word
 * count over a plain fetch cannot know what the stylesheet hides (menus, mobile-only blocks), so it
 * overcounts the no-script page (GitHub 1020 vs 811, Python 1051 vs 616, Vercel 512 vs 64 words);
 * the browser applies the CSS and answers exactly. Every request still passes the SSRF guard.
 */
export async function measureWithoutJs(url: string, timeoutMs = 9000, userAgent: string = BROWSER_UA): Promise<NoJsMeasure> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1366, height: 900 }); // same desktop viewport as the rendered load
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return;
      void browserRequestAllowed(req.url())
        .then((allowed) => (allowed ? req.continue() : req.abort('blockedbyclient')))
        .catch(() => req.abort('blockedbyclient').catch(() => {}));
    });
    const response = await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
    // evaluate() runs through the DevTools protocol, so it works with page scripts disabled.
    const read = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]')).filter((a) => {
        const h = (a.getAttribute('href') || '').trim();
        return h !== '' && !h.startsWith('#') && !/^(javascript|mailto|tel):/i.test(h);
      });
      return {
        title: document.title || '',
        h1: Array.from(document.querySelectorAll('h1')).map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
        text: document.body ? document.body.innerText : '',
        links: links.length
      };
    });
    return { status: response?.status() ?? 0, ...read };
  } finally {
    await page.close().catch(() => {});
  }
}
