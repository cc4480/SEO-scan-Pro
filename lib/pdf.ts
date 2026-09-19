import { getBrowser } from './browser';

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
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
