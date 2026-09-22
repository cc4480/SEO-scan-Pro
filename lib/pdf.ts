import { getBrowser } from './browser';
import { browserRequestAllowed } from './ssrfGuard';

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // The report HTML carries content derived from the SCANNED site — its
    // title, and an executive summary an LLM wrote after reading that site's
    // pages. A hostile site can steer that into markup; the template escapes
    // it (see escapeHtml in server.ts), and this is the second layer: whatever
    // reaches this page may not make the server's browser request a private
    // address. Public hosts (the Tailwind CDN, fonts, an agency's logo) still
    // load normally.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return;
      void browserRequestAllowed(req.url())
        .then((allowed) => (allowed ? req.continue() : req.abort('blockedbyclient')))
        .catch(() => req.abort('blockedbyclient').catch(() => {}));
    });
    // setContent's waitUntil is narrower than goto's — 'load' still waits for the page's
    // external resources (Tailwind CDN script, Google Fonts) referenced in the initial HTML.
    await page.setContent(html, { waitUntil: 'load' });
    // The report HTML has @media print rules (hides the "Print/Save" button, forces a
    // white background) — explicitly emulate print so those apply for the server render too.
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.4in', bottom: '0.4in', left: '0.3in', right: '0.3in' }
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export { closeBrowser as closePdfBrowser } from './browser';
