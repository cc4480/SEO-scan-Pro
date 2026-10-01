import { describe, it, expect, vi, beforeEach } from 'vitest';

// One scripted network for the whole file: each test sets `route` to decide what every request gets.
type Req = { url: string; ua: string };
let route: (r: Req) => number | 'fail' | { status: number; text?: string };
const seen: Req[] = [];

vi.mock('../../lib/ssrfGuard', async () => {
  const real = await vi.importActual<typeof import('../../lib/ssrfGuard')>('../../lib/ssrfGuard');
  return {
    ...real,
    assertPublicUrl: vi.fn(async (u: string) => new URL(u)),
    safeFetch: vi.fn(async (url: string, opts: { headers?: Record<string, string> } = {}) => {
      // Mirrors the real default: no caller identity => the polite SEOScanPro one.
      const ua = opts.headers?.['User-Agent'] ?? real.defaultUserAgent();
      const req = { url, ua };
      seen.push(req);
      const out = route(req);
      if (out === 'fail') throw new Error('timed out');
      const r = typeof out === 'number' ? { status: out, text: '' } : { text: '', ...out };
      return { status: r.status, ok: r.status >= 200 && r.status < 300, headers: {}, url, text: r.text };
    })
  };
});
vi.mock('../../lib/browser', () => ({ getBrowser: vi.fn(async () => { throw new Error('no browser in unit test'); }) }));

import { checkBotAccess, RETRY_DELAY_MS } from '../../lib/audit/botAccess';
import { defaultUserAgent } from '../../lib/ssrfGuard';
import { crawlUrl } from '../../lib/crawler';

const BROWSER = /Chrome\/\d+/;
const isBrowser = (r: Req) => BROWSER.test(r.ua);

beforeEach(() => { seen.length = 0; });

describe('default request identity (A-01)', () => {
  it('identifies the scanner with a polite User-Agent that names the site', () => {
    process.env.APP_URL = 'https://scan.example.test';
    expect(defaultUserAgent()).toBe('Mozilla/5.0 (compatible; SEOScanPro/1.1; +https://scan.example.test)');
    delete process.env.APP_URL;
    expect(defaultUserAgent()).toMatch(/^Mozilla\/5\.0 \(compatible; SEOScanPro\/1\.1; \+https?:\/\//);
  });

  it('safeFetch sends it when the caller passes none, and keeps a caller-chosen one', async () => {
    const real = await vi.importActual<typeof import('../../lib/ssrfGuard')>('../../lib/ssrfGuard');
    const http = await import('node:http');
    const server = http.createServer((req, res) => { res.end(String(req.headers['user-agent'])); });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as { port: number }).port;
    const prevEnv = { NODE_ENV: process.env.NODE_ENV, L: process.env.SSRF_ALLOW_LOOPBACK };
    process.env.NODE_ENV = 'test';
    process.env.SSRF_ALLOW_LOOPBACK = 'true';
    try {
      const plain = await real.safeFetch(`http://127.0.0.1:${port}/`);
      expect(plain.text).toBe(real.defaultUserAgent());
      const own = await real.safeFetch(`http://127.0.0.1:${port}/`, { headers: { 'user-agent': 'MyBot/1' } });
      expect(own.text).toBe('MyBot/1');
    } finally {
      process.env.NODE_ENV = prevEnv.NODE_ENV;
      if (prevEnv.L === undefined) delete process.env.SSRF_ALLOW_LOOPBACK; else process.env.SSRF_ALLOW_LOOPBACK = prevEnv.L;
      server.close();
    }
  });
});

describe('crawlUrl: robots.txt that cannot be read (A-01)', () => {
  async function crawlWith(robotsStatus: number) {
    route = (r) => (r.url.endsWith('/robots.txt') ? robotsStatus : r.url.endsWith('/sitemap.xml') ? 404 : r.url.endsWith('/llms.txt') ? 404 : 200);
    const events: string[] = [];
    const res = await crawlUrl('https://site.test', 'SINGLE', 1, (_s, _l, m) => { events.push(m); });
    return { res, log: events.join('\n') };
  }

  it('reports a 403 robots.txt as unreadable, never as "no rules published"', async () => {
    const { res, log } = await crawlWith(403);
    expect(res.robotsReadable).toBe(false);
    expect(res.robotsBlocksAll).toBeUndefined();
    expect(log).toMatch(/robots\.txt could not be read: HTTP 403/);
    expect(log).not.toMatch(/no crawl rules published/);
    // the sitemap cannot be called missing when robots.txt (which may name it) was unreadable
    expect(res.sitemapFound).toBe(false);
    expect(res.sitemapChecked).toBe(false);
    expect(log).toMatch(/sitemap could not be checked/);
  });

  it('treats a 404 robots.txt as "none published" and a 404 sitemap as really missing', async () => {
    const { res, log } = await crawlWith(404);
    expect(res.robotsReadable).toBe(true);
    expect(log).toMatch(/no crawl rules published/);
    expect(res.sitemapChecked).toBe(true);
    expect(res.sitemapFound).toBe(false);
    expect(res.llmsChecked).toBe(true);
  });

  it('marks llms.txt unchecked when it is refused', async () => {
    route = (r) => (r.url.endsWith('/llms.txt') ? 406 : 404);
    const res = await crawlUrl('https://site.test', 'SINGLE', 1);
    expect(res.llmsChecked).toBe(false);
    expect(res.llmsTxtFound).toBe(false);
  });
});

describe('checkBotAccess (A-02)', () => {
  const run = (robots: string | null = 'User-agent: *\nAllow: /') => checkBotAccess('https://site.test', robots, 200, () => {});
  const by = (res: Awaited<ReturnType<typeof run>>, n: string) => res.results.find((r) => r.name === n)!;

  it('takes its baseline from a browser-identity request through the same transport', async () => {
    route = () => 200;
    const res = await run();
    expect(seen.filter(isBrowser)).toHaveLength(1);
    expect(res.baselineStatus).toBe(200);
    expect(res.baselineRefused).toBe(false);
  });

  it('calls nothing a block when the baseline itself is refused', async () => {
    route = (r) => (isBrowser(r) || /GPTBot|ClaudeBot/.test(r.ua) ? 403 : 200); // refuses every plain client
    const res = await checkBotAccess('https://site.test', 'User-agent: *\nAllow: /', 200, () => {});
    expect(res.baselineRefused).toBe(true);
    expect(res.results.every((r) => !r.blocked)).toBe(true);
    expect(by(res, 'GPTBot').inconclusive).toBe(true);
    expect(by(res, 'Googlebot').inconclusive).toBeFalsy();
    expect(res.conflicts).toEqual([]);
  });

  it('marks a refused Googlebot/Bingbot/Applebot inconclusive when the baseline is fine', async () => {
    route = (r) => (/Googlebot|bingbot|Applebot/.test(r.ua) ? 403 : 200);
    const res = await run();
    for (const n of ['Googlebot', 'Bingbot', 'Applebot']) {
      expect(by(res, n).blocked).toBe(false);
      expect(by(res, n).inconclusive).toBe(true);
    }
    expect(res.results.filter((r) => r.blocked)).toHaveLength(0);
  });

  it('still reports a refused GPTBot as blocked', async () => {
    route = (r) => (/GPTBot/.test(r.ua) ? 403 : 200);
    const res = await run();
    expect(by(res, 'GPTBot').blocked).toBe(true);
    expect(by(res, 'GPTBot').inconclusive).toBe(false);
    expect(res.conflicts).toEqual(['GPTBot']);
  });

  it('retries one transient failure and does not count it as a block', async () => {
    let tries = 0;
    route = (r) => (/CCBot/.test(r.ua) && tries++ === 0 ? 'fail' : 200);
    const res = await run();
    expect(by(res, 'CCBot').status).toBe(200);
    expect(by(res, 'CCBot').blocked).toBe(false);
  });

  it('marks everything inconclusive when every crawler look-alike gets 419 but a browser gets 200 (N6)', async () => {
    route = (r) => (isBrowser(r) ? 200 : 419);
    const events: string[] = [];
    const res = await checkBotAccess('https://site.test', 'User-agent: *\nAllow: /', 200, (_s, _l, m) => { events.push(m); });
    expect(res.baselineRefused).toBe(false);
    expect(res.results.every((r) => !r.blocked && r.inconclusive)).toBe(true);
    expect(res.conflicts).toEqual([]);
    const log = events.join('\n');
    expect(log).not.toMatch(/all 13 crawlers received the page/);
    expect(log).toMatch(/does not show that the real crawlers are blocked/);
  });

  it('does not call a lone unusual status (419) a block, and says so in the log', async () => {
    route = (r) => (/CCBot/.test(r.ua) ? 419 : 200);
    const events: string[] = [];
    const res = await checkBotAccess('https://site.test', null, 200, (_s, _l, m) => { events.push(m); });
    expect(by(res, 'CCBot').blocked).toBe(false);
    expect(by(res, 'CCBot').inconclusive).toBe(true);
    expect(events.join('\n')).not.toMatch(/all 13 crawlers received the page/);
  });

  it('retries a single 429 once and does not count it as a block (N7)', async () => {
    let tries = 0;
    route = (r) => (/Bytespider/.test(r.ua) && tries++ === 0 ? 429 : 200);
    const res = await run();
    expect(by(res, 'Bytespider').status).toBe(200);
    expect(by(res, 'Bytespider').blocked).toBe(false);
  });

  it('still reports a 429 that persists on the retry as a block', async () => {
    route = (r) => (/Bytespider/.test(r.ua) ? 429 : 200);
    const res = await run();
    expect(by(res, 'Bytespider').blocked).toBe(true);
  });

  it('reports a failure that persists as "no response"', async () => {
    route = (r) => (/CCBot/.test(r.ua) ? 'fail' : 200);
    const events: string[] = [];
    const t0 = Date.now();
    const res = await checkBotAccess('https://site.test', null, 200, (_s, _l, m) => { events.push(m); });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(RETRY_DELAY_MS - 50);
    expect(by(res, 'CCBot').status).toBe(0);
    expect(by(res, 'CCBot').blocked).toBe(true);
    expect(events.join('\n')).toMatch(/CCBot .*no response \(tried twice\) — BLOCKED/);
    expect(res.unreadableRobots).toBe(true);
    expect(by(res, 'CCBot').robotsAllows).toBeNull();
  });
});

describe('robots.txt verdicts per crawler (R3-03)', () => {
  // LinkedIn-like: "*" shuts everything, named groups carve out access.
  const linkedinLike = [
    'User-agent: Googlebot', 'Allow: /in/', 'Allow: /pub/', 'Disallow: /', '',
    'User-agent: Bingbot', 'Allow: /jobs/', 'Disallow: /', '',
    'User-agent: Claude-SearchBot', 'Disallow: /private/', '',
    'User-agent: GPTBot', 'Disallow: /', '',
    'User-agent: *', 'Disallow: /'
  ].join('\n');

  it('does not say "blocks everyone" when named groups grant access', async () => {
    const { robotsBlocksAll } = await import('../../lib/crawler');
    expect(robotsBlocksAll(linkedinLike)).toBe(false);
  });

  it('still says it when "*" disallows everything and no named group helps', async () => {
    const { robotsBlocksAll } = await import('../../lib/crawler');
    expect(robotsBlocksAll('User-agent: *\nDisallow: /')).toBe(true);
    expect(robotsBlocksAll('User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /')).toBe(true);
    expect(robotsBlocksAll('User-agent: *\nDisallow: /private')).toBe(false);
  });

  it('reports what each named crawler is granted', async () => {
    const { robotsAccess } = await import('../../lib/audit/robotsRules');
    expect(robotsAccess(linkedinLike, 'Googlebot')).toBe('partial');
    expect(robotsAccess(linkedinLike, 'bingbot')).toBe('partial');
    expect(robotsAccess(linkedinLike, 'Claude-SearchBot')).toBe('allowed');
    expect(robotsAccess(linkedinLike, 'GPTBot')).toBe('disallowed');
    expect(robotsAccess(linkedinLike, 'CCBot')).toBe('disallowed'); // falls to "*"
  });

  it('crawlUrl exposes robotsByCrawler and keeps robotsBlocksAll false for a LinkedIn-like file', async () => {
    route = (r) => (r.url.endsWith('/robots.txt') ? { status: 200, text: linkedinLike } : 404);
    const res = await crawlUrl('https://site.test', 'SINGLE', 1);
    expect(res.robotsBlocksAll).toBe(false);
    expect(res.robotsByCrawler?.Googlebot).toBe('partial');
    expect(res.robotsByCrawler?.GPTBot).toBe('disallowed');
    expect(res.robotsByCrawler?.['Claude-SearchBot']).toBe('allowed');
  });
});
