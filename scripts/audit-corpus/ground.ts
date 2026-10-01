/**
 * Independent ground truth for the accuracy corpus. Everything here is measured a DIFFERENT way
 * from the scanner, so the scanner is not grading itself:
 *  - its own Chromium instance and live DOM queries (not the scanner's regex over page.content())
 *  - the "no JavaScript" view is a real page load with JavaScript disabled (not a fetch + regex)
 *  - robots.txt, sitemap, llms.txt, security headers and crawler access via plain HTTP requests
 *
 *   npx tsx scripts/audit-corpus/ground.ts          # every URL
 *   npx tsx scripts/audit-corpus/ground.ts 05 12    # only ids starting with 05 or 12
 */
import fs from 'fs';
import path from 'path';
import puppeteer, { type Browser } from 'puppeteer';
import { BOTS } from '../../lib/audit/botAccess';

interface Entry { id: string; url: string }
const root = path.resolve(process.cwd(), 'audit-corpus');
const outDir = path.join(root, 'ground');
fs.mkdirSync(outDir, { recursive: true });

const all: Entry[] = JSON.parse(fs.readFileSync(path.join(root, 'urls.json'), 'utf8'));
const only = process.argv.slice(2);
const todo = only.length ? all.filter((e) => only.some((p) => e.id.startsWith(p))) : all;

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const words = (s: string) => (s ? s.split(/\s+/).filter(Boolean).length : 0);

async function http(url: string, ua = UA): Promise<{ status: number; text: string; headers: Record<string, string> }> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'text/html,*/*' }, redirect: 'follow', signal: ctl.signal });
    const text = (await res.text()).slice(0, 600000);
    clearTimeout(t);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { status: res.status, text, headers };
  } catch {
    return { status: 0, text: '', headers: {} };
  }
}

// The in-page measurement lives in measure.js (plain JavaScript, so no bundler helper is injected).
const MEASURE_SRC = fs.readFileSync(path.resolve(process.cwd(), 'scripts/audit-corpus/measure.js'), 'utf8');

async function one(browser: Browser, e: Entry): Promise<void> {
  const origin = new URL(e.url).origin;
  const out: any = { id: e.id, url: e.url, collectedAt: new Date().toISOString() };

  // Rendered view.
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1366, height: 900 });
    const res = await page.goto(e.url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 1500));
    const m = await page.evaluate(MEASURE_SRC) as any;
    out.rendered = { status: res?.status() ?? 0, finalUrl: page.url(), ...m, words: words(m.bodyText) };
    const h = res?.headers() ?? {};
    out.securityHeaders = {
      hsts: 'strict-transport-security' in h,
      csp: 'content-security-policy' in h,
      xFrame: 'x-frame-options' in h || /frame-ancestors/i.test(h['content-security-policy'] || ''),
      xcto: 'x-content-type-options' in h,
      referrer: 'referrer-policy' in h,
      https: page.url().startsWith('https://')
    };
    delete out.rendered.bodyText;
    out.rendered.bodySample = m.bodyText.slice(0, 400);
    await page.close();
  } catch (err: any) {
    out.renderedError = String(err?.message || err).slice(0, 160);
  }

  // JavaScript-disabled view: what a crawler that does not run scripts gets once the HTML is parsed.
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setUserAgent(UA);
    const res = await page.goto(e.url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
    const m = await page.evaluate(MEASURE_SRC) as any;
    out.noJs = { status: res?.status() ?? 0, words: words(m.bodyText), anchors: m.anchors, jsonLdTypes: m.jsonLdTypes, h1: m.h1.length, imagesTotal: m.imagesTotal };
    await page.close();
  } catch (err: any) {
    out.noJsError = String(err?.message || err).slice(0, 160);
  }

  // Plain HTTP facts.
  const [robots, sitemap, llms, home] = await Promise.all([http(`${origin}/robots.txt`), http(`${origin}/sitemap.xml`), http(`${origin}/llms.txt`), http(e.url)]);
  const sitemapLine = robots.text.split('\n').find((l) => /^sitemap:/i.test(l.trim()));
  out.http = {
    baseline: home.status,
    robotsStatus: robots.status,
    robotsDisallowAll: /user-agent:\s*\*[\s\S]*?\n\s*disallow:\s*\/\s*(\n|$)/i.test(robots.text),
    robotsSitemapDirective: sitemapLine ? sitemapLine.split(/:(.+)/)[1]?.trim() : null,
    sitemapXmlStatus: sitemap.status,
    llmsStatus: llms.status,
    llmsLooksLikeHtml: /<html/i.test(llms.text.slice(0, 500))
  };

  // Crawler access by user agent.
  out.bots = {};
  for (let i = 0; i < BOTS.length; i += 4) {
    const batch = BOTS.slice(i, i + 4);
    const res = await Promise.all(batch.map((b) => http(e.url, b.userAgent)));
    batch.forEach((b, n) => { out.bots[b.name] = res[n].status; });
  }

  fs.writeFileSync(path.join(outDir, `${e.id}.json`), JSON.stringify(out, null, 1));
  console.log(`gt   ${e.id.padEnd(20)} words ${out.rendered?.words ?? '-'} | no-JS ${out.noJs?.words ?? '-'} | imgs ${out.rendered?.imagesTotal ?? '-'} | jsonld ${(out.rendered?.jsonLdTypes || []).length}`);
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const queue = [...todo];
  await Promise.all(Array.from({ length: 2 }, async () => { for (let e = queue.shift(); e; e = queue.shift()) await one(browser, e); }));
  await browser.close();
  console.log(`done: ground truth for ${todo.length} site(s) -> ${outDir}`);
  process.exit(0);
}
main();
