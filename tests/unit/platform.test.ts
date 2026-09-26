import { describe, it, expect, vi, afterEach } from 'vitest';
import { csvCell, toCsv, scanToRow, SCAN_CSV_COLUMNS } from '../../lib/exporters';
import { computeAlert } from '../../lib/alerts';
import { enqueue, queueStats } from '../../lib/queue';
import { nextRunFrom } from '../../lib/scheduler';
import { sendEmail, sendScoreAlertEmail, escapeHtml } from '../../lib/email';
import { generateToken, verifyToken, generateApiKey, hashApiKey } from '../../lib/auth';
import { parsePage, robotsBlocksAll, securityHeadersFrom, findDuplicates, checkLinks } from '../../lib/crawler';
import { generateSeoReport } from '../../lib/deepseek';
import type { CrawlResult } from '../../src/types';

describe('CSV export', () => {
  it('neutralises spreadsheet formula injection', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('-2')).toBe("'-2");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('quotes cells containing commas, quotes and newlines (RFC 4180)', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(0)).toBe('0');
  });

  it('builds a header plus one row per scan', () => {
    const row = scanToRow({
      id: 's1', url: 'https://x.test', status: 'COMPLETED', mode: 'SINGLE', createdAt: '2026-01-01T00:00:00Z',
      leadEmail: '=cmd@x.test', leadName: null,
      seoReport: { score: { overall: 80, technical: 70, content: 60, aeoGeo: 50, performance: 90 }, criticalIssues: ['a', 'b'] },
      crawlData: { hasSimulatedData: false }
    });
    const csv = toCsv(SCAN_CSV_COLUMNS, [row]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe(SCAN_CSV_COLUMNS.join(','));
    expect(lines[1]).toContain('https://x.test');
    expect(lines[1]).toContain(",80,70,60,50,90,2,false,'=cmd@x.test,");
  });

  it('leaves score columns empty for a scan with no report', () => {
    const row = scanToRow({ id: 's2', url: 'u', status: 'FAILED', mode: 'SINGLE', createdAt: new Date() });
    expect(row.overall).toBe('');
    expect(row.criticalIssues).toBe('');
  });
});

describe('computeAlert', () => {
  const prev = { score: { overall: 80 }, criticalIssues: ['old issue'] };

  it('alerts when the score drops by at least the threshold and lists only NEW issues', () => {
    const d = computeAlert(prev, { score: { overall: 70 }, criticalIssues: ['old issue', 'new issue'] }, 5);
    expect(d).toEqual({ previousScore: 80, currentScore: 70, drop: 10, newIssues: ['new issue'] });
  });

  it('does not alert on a drop below the threshold, on a rise, or with missing scores', () => {
    expect(computeAlert(prev, { score: { overall: 77 } }, 5)).toBeNull();
    expect(computeAlert(prev, { score: { overall: 95 } }, 5)).toBeNull();
    expect(computeAlert(prev, {}, 5)).toBeNull();
    expect(computeAlert(null, { score: { overall: 10 } }, 5)).toBeNull();
  });

  it('alerts exactly at the threshold', () => {
    expect(computeAlert(prev, { score: { overall: 75 } }, 5)).not.toBeNull();
  });
});

describe('scan queue', () => {
  it('never runs more than SCAN_CONCURRENCY jobs at once and drains everything', async () => {
    process.env.SCAN_CONCURRENCY = '2';
    let active = 0;
    let peak = 0;
    let finished = 0;
    const jobs = Array.from({ length: 6 }, () => async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 15));
      active--;
      finished++;
    });
    jobs.forEach((j) => enqueue(j));
    await vi.waitFor(() => expect(finished).toBe(6), { timeout: 2000 });
    expect(peak).toBe(2);
    expect(queueStats()).toMatchObject({ running: 0, waiting: 0 });
    delete process.env.SCAN_CONCURRENCY;
  });

  it('keeps draining after a job throws', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let ran = false;
    enqueue(async () => { throw new Error('boom'); });
    enqueue(async () => { ran = true; });
    await vi.waitFor(() => expect(ran).toBe(true), { timeout: 1000 });
    errSpy.mockRestore();
  });
});

describe('nextRunFrom', () => {
  it('adds one day or one week', () => {
    const t = new Date('2026-01-01T00:00:00Z');
    expect(nextRunFrom(t, 'DAILY').toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(nextRunFrom(t, 'WEEKLY').toISOString()).toBe('2026-01-08T00:00:00.000Z');
    expect(nextRunFrom(t, 'nonsense').toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });
});

describe('email', () => {
  const saved = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM };
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (saved.key === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = saved.key;
    if (saved.from === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = saved.from;
  });

  it('sends nothing (and does not throw) when no provider is configured', async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(sendEmail({ to: 'a@b.test', subject: 's', html: 'h', text: 't' })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to Resend with bearer auth when configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'alerts@example.test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    await expect(sendEmail({ to: 'a@b.test', subject: 'Hello', html: '<p>h</p>', text: 't' })).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(JSON.parse(init.body)).toMatchObject({ from: 'alerts@example.test', to: ['a@b.test'], subject: 'Hello' });
  });

  it('returns false instead of throwing when the provider rejects or the network fails', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'alerts@example.test';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'bad' }));
    await expect(sendEmail({ to: 'a@b.test', subject: 's', html: 'h', text: 't' })).resolves.toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(sendEmail({ to: 'a@b.test', subject: 's', html: 'h', text: 't' })).resolves.toBe(false);
  });

  it('escapes site-controlled text in the alert email body', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_FROM = 'alerts@example.test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    await sendScoreAlertEmail('a@b.test', {
      agencyName: '<b>Agency</b>', url: 'https://x.test/?q=<script>', previousScore: 90, currentScore: 70,
      newIssues: ['<img src=x onerror=alert(1)>']
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.html).not.toContain('<script>');
    expect(body.html).not.toContain('<img');
    expect(body.html).toContain('&lt;img');
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;');
  });
});

describe('token versions and API keys', () => {
  it('carries the token version and defaults legacy tokens to 0', () => {
    expect(verifyToken(generateToken('u1', 3))).toEqual({ userId: 'u1', tokenVersion: 3 });
    expect(verifyToken(generateToken('u1'))?.tokenVersion).toBe(0);
  });

  it('generates prefixed, unique keys whose hash is what gets stored', () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.key.startsWith('ssp_')).toBe(true);
    expect(a.key).not.toBe(b.key);
    expect(a.prefix).toBe(a.key.slice(0, 8));
    expect(a.keyHash).toBe(hashApiKey(a.key));
    expect(a.keyHash).not.toContain(a.key);
  });
});

describe('crawler: new checks', () => {
  const html = `<!doctype html><html lang="en"><head><title>Home</title>
    <meta property="og:title" content="OG Title"><meta property="og:image" content="/i.png">
    <meta name="twitter:card" content="summary">
    <link rel="alternate" hreflang="es" href="https://x.test/es">
    <link href="https://x.test/fr" hreflang="fr" rel="alternate">
    <style>.a{color:red} .b{color:blue}</style></head>
    <body><script>var junk = "not visible words here";</script><h1>Hello world</h1><p>one two three four five</p></body></html>`;

  it('extracts lang, Open Graph/Twitter tags, hreflang and a visible word count', () => {
    const page = parsePage('https://x.test/', html, 100);
    expect(page.lang).toBe('en');
    expect(page.social).toMatchObject({ ogTitle: 'OG Title', ogImage: '/i.png', twitterCard: 'summary', ogDescription: '' });
    expect(page.hreflang).toEqual([{ lang: 'es', href: 'https://x.test/es' }, { lang: 'fr', href: 'https://x.test/fr' }]);
    // "Hello world" + "one two three four five"; script/style text must not be counted.
    expect(page.wordCount).toBe(7);
  });

  it('reports an empty lang and no social tags when they are absent', () => {
    const page = parsePage('https://x.test/', '<html><head><title>t</title></head><body>hi</body></html>', 1);
    expect(page.lang).toBe('');
    expect(page.social?.ogImage).toBe('');
    expect(page.hreflang).toEqual([]);
  });

  describe('robotsBlocksAll', () => {
    it('detects a wildcard Disallow: /', () => {
      expect(robotsBlocksAll('User-agent: *\nDisallow: /')).toBe(true);
      expect(robotsBlocksAll('user-agent: *\r\ndisallow: /   # staging\r\n')).toBe(true);
    });
    it('ignores partial disallows, empty disallows and rules for other agents', () => {
      expect(robotsBlocksAll('User-agent: *\nDisallow: /admin')).toBe(false);
      expect(robotsBlocksAll('User-agent: *\nDisallow:')).toBe(false);
      expect(robotsBlocksAll('User-agent: BadBot\nDisallow: /')).toBe(false);
      expect(robotsBlocksAll('User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nAllow: /')).toBe(false);
      expect(robotsBlocksAll('')).toBe(false);
    });
    it('handles stacked user-agent lines sharing one rule group', () => {
      expect(robotsBlocksAll('User-agent: Googlebot\nUser-agent: *\nDisallow: /')).toBe(true);
    });
  });

  it('classifies security headers', () => {
    expect(securityHeadersFrom({}, 'http://x.test')).toEqual({
      https: false, hsts: false, csp: false, xFrameOptions: false, xContentTypeOptions: false, referrerPolicy: false
    });
    expect(
      securityHeadersFrom(
        {
          'strict-transport-security': 'max-age=1',
          'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer'
        },
        'https://x.test'
      )
    ).toEqual({ https: true, hsts: true, csp: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true });
  });

  it('finds titles shared by several real pages and ignores simulated ones', () => {
    const mk = (url: string, title: string, isSimulated = false) => ({ ...parsePage(url, `<title>${title}</title>`, 1), isSimulated });
    const dupes = findDuplicates(
      [mk('https://x.test/', 'Same'), mk('https://x.test/a', 'same'), mk('https://x.test/b', 'Other'), mk('https://x.test/c', 'Same', true)],
      (p) => p.meta.title
    );
    expect(dupes).toEqual([{ value: 'Same', urls: ['https://x.test/', 'https://x.test/a'] }]);
  });

  it('refuses to probe private addresses when checking links (SSRF guard applies)', async () => {
    const result = await checkLinks([
      { href: 'http://127.0.0.1:9/x', type: 'internal', text: 'a' },
      { href: 'http://169.254.169.254/latest', type: 'external', text: 'b' },
      { href: 'javascript:void(0)', type: 'internal', text: 'c' }
    ]);
    expect(result).toEqual({ broken: [], checked: 0 });
  });
});

describe('simulator report uses the new checks only on real evidence', () => {
  const base = (over: Partial<CrawlResult> = {}, pageOver: any = {}): CrawlResult => ({
    rootUrl: 'https://x.test/', mode: 'SINGLE', depth: 1, timestamp: '', additionalPages: [],
    sitemapFound: true, llmsTxtFound: false, hasSimulatedData: false,
    mainPage: { ...parsePage('https://x.test/', '<html lang="en"><head><title>T</title><meta name="description" content="d"></head><body><h1>H</h1><h2>a</h2><h2>b</h2><h2>c</h2></body></html>', 100), ...pageOver },
    ...over
  });

  it('flags a site-wide robots block as critical and drops the technical score', async () => {
    delete process.env.DEEPSEEK_API_KEY;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const clean = await generateSeoReport(base());
    const blocked = await generateSeoReport(base({ robotsBlocksAll: true }));
    expect(blocked.criticalIssues.some((i) => /robots\.txt/.test(i))).toBe(true);
    expect(blocked.score.technical).toBeLessThan(clean.score.technical);
    expect(clean.criticalIssues.some((i) => /robots\.txt/.test(i))).toBe(false);
  });

  it('treats absent fields as "not checked", not as failures', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const legacy = base();
    delete (legacy.mainPage as any).social;
    delete (legacy.mainPage as any).lang;
    delete (legacy.mainPage as any).wordCount;
    const report = await generateSeoReport(legacy);
    const titles = report.recommendedFixes.map((f) => f.title);
    expect(titles).not.toContain('Add Open Graph / Twitter Card tags');
    expect(titles).not.toContain('Declare the page language');
    expect(titles).not.toContain('Expand thin page content');
  });

  it('reports broken links, missing security headers and duplicate titles when the crawl shows them', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const report = await generateSeoReport(
      base({
        brokenLinks: [{ href: 'https://x.test/gone', status: 404, type: 'internal' }],
        linksChecked: 12,
        securityHeaders: { https: true, hsts: false, csp: false, xFrameOptions: false, xContentTypeOptions: false, referrerPolicy: false },
        duplicateTitles: [{ value: 'Same', urls: ['https://x.test/', 'https://x.test/a'] }],
        redirectChain: ['http://x.test/', 'https://x.test/', 'https://www.x.test/']
      })
    );
    const titles = report.recommendedFixes.map((f) => f.title);
    expect(titles).toEqual(expect.arrayContaining([
      'Fix or remove broken links', 'Add missing security headers', 'Give every page a unique title', 'Collapse the redirect chain'
    ]));
    expect(report.recommendedFixes.find((f) => f.title === 'Fix or remove broken links')?.description).toContain('1 of 12');
  });
});
