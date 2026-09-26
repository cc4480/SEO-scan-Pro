import puppeteer, { Browser } from 'puppeteer';

// Shared across the crawler and PDF export — a single lazily-launched Chromium instance
// reused for the lifetime of the process, rather than each caller spawning its own.
let browserPromise: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    // --disable-dev-shm-usage: Docker gives /dev/shm only 64MB, which crashes Chromium on
    // real pages; this makes it use /tmp instead.
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // Chromium can die at any time (OOM, a crash, an external kill). Without this the cached
  // promise would keep handing back a dead browser and every later crawl and PDF export
  // would fail until the whole process was restarted. Dropping the cache here lets the
  // next call relaunch cleanly.
  browser.on('disconnected', () => {
    browserPromise = null;
  });

  return browser;
}

export async function getBrowser(): Promise<Browser> {
  const pending = browserPromise;

  if (pending) {
    try {
      const browser = await pending;
      // `connected` also covers the window before the disconnect event is processed.
      if (browser.connected) return browser;
    } catch {
      // The previous launch rejected — fall through and try again rather than
      // permanently caching the failure.
    }
    browserPromise = null;
  }

  browserPromise = launch();
  // Never cache a rejected launch: one transient spawn failure must not brick the process.
  browserPromise.catch(() => {
    browserPromise = null;
  });

  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  const pending = browserPromise;
  browserPromise = null;
  if (!pending) return;

  try {
    const browser = await pending;
    await browser.close();
  } catch {
    // Already gone (or never launched) — there is nothing to close.
  }
}
