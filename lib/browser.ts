import puppeteer, { Browser } from 'puppeteer';

// Shared across the crawler and PDF export — a single lazily-launched Chromium instance
// reused for the lifetime of the process, rather than each caller spawning its own.
let browserPromise: Promise<Browser> | null = null;

export function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
