// Renders the PNG brand assets (app icons and the social share card) from public/favicon.svg and
// public/logo.jpg using the project's Chromium:  node scripts/build-brand-assets.mjs
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const pub = path.resolve(process.cwd(), 'public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(pub, 'logo.jpg')).toString('base64');
const BG = 'radial-gradient(circle at 50% 35%, #0c2442 0%, #030b18 70%)';

const icon = (size) => `<html><body style="margin:0;width:${size}px;height:${size}px;background:${BG};display:flex;align-items:center;justify-content:center">
<div style="width:${Math.round(size * 0.66)}px;height:${Math.round(size * 0.66)}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`;

const og = `<html><body style="margin:0;width:1200px;height:630px;background:${BG};font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;display:flex;align-items:center">
<img src="${logo}" style="height:630px;width:auto;mix-blend-mode:screen"/>
<div style="padding-left:30px;max-width:620px">
  <div style="font-size:92px;font-weight:800;letter-spacing:-2px;color:#fff">Seo<span style="color:#6fcb55">Scan</span></div>
  <div style="font-size:34px;line-height:1.3;margin-top:14px;color:#a5f3fc">SEO and AI-search audits in one scan.</div>
  <div style="font-size:24px;margin-top:22px;color:#94a3b8">Real-browser crawl · 13 audit stages · fix checklist</div>
</div></body></html>`;

const jobs = [
  ['apple-touch-icon.png', icon(180), 180, 180],
  ['icon-512.png', icon(512), 512, 512],
  ['og.png', og, 1200, 630]
];

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
for (const [file, html, w, h] of jobs) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(pub, file) });
  await page.close();
  console.log('wrote', file);
}
await browser.close();
