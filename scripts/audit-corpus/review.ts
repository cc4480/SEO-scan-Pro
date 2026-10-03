/**
 * Compares the scanner's results with the independent ground truth and writes, per site, a review
 * sheet (docs/accuracy/runs/<date>/<id>.md) plus a summary (docs/accuracy/runs/<date>/SUMMARY.md).
 *
 *   npx tsx scripts/audit-corpus/review.ts 2026-09-30
 *
 * Two kinds of checks:
 *  1. MEASUREMENTS: each fact the scanner recorded vs the same fact measured independently.
 *  2. CLAIMS: every written critical issue and fix is scanned for assertions that can be checked
 *     against the ground truth ("no canonical", "N words", "GPTBot blocked"…); contradictions are flagged.
 * A human still reads each sheet: these checks find contradictions, they do not prove a finding is right.
 */
import fs from 'fs';
import path from 'path';

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const root = path.resolve(process.cwd(), 'audit-corpus');
const outDir = path.resolve(process.cwd(), 'docs/accuracy/runs', date);
fs.mkdirSync(outDir, { recursive: true });

const urls: Array<{ id: string; url: string; kind: string; why: string }> = JSON.parse(fs.readFileSync(path.join(root, 'urls.json'), 'utf8'));
const read = (dir: string, id: string) => { try { return JSON.parse(fs.readFileSync(path.join(root, dir, `${id}.json`), 'utf8')); } catch { return null; } };

const REFUSAL = new Set([401, 403, 406, 429, 0]);
const within = (a: number, b: number, pct: number, abs = 0) => Math.abs(a - b) <= Math.max(abs, Math.max(a, b) * pct);

interface Row { fact: string; scanner: string; truth: string; ok: boolean; note?: string }

function measurements(r: any, g: any): Row[] {
  const rows: Row[] = [];
  const c = r.crawl, p = c.mainPage, f = c.facts || {};
  const t = g.rendered;
  const add = (fact: string, scanner: any, truth: any, ok: boolean, note?: string) => rows.push({ fact, scanner: String(scanner), truth: String(truth), ok, note });
  if (!t) return [{ fact: 'ground truth', scanner: '-', truth: g.renderedError || 'missing', ok: false, note: 'ground truth could not be collected' }];

  if (c.hasSimulatedData) {
    add('page reached', 'simulated', `status ${t.status}`, t.status >= 400 || t.status === 0, 'scanner used placeholder data');
    return rows;
  }
  add('title', JSON.stringify(p.meta.title).slice(0, 50), JSON.stringify(t.title).slice(0, 50), p.meta.title.trim() === t.title.trim());
  add('meta description present', !!p.meta.description, !!t.description, !!p.meta.description === !!t.description);
  add('canonical', p.meta.canonical || '-', t.canonical || '-', (p.meta.canonical || '') === (t.canonical || ''));
  add('viewport present', !!p.meta.viewport, !!t.viewport, !!p.meta.viewport === !!t.viewport);
  add('html lang', p.lang ?? '-', t.lang || '-', (p.lang ?? '') === (t.lang || ''));
  add('H1 count', p.headings.h1.length, t.h1.length, p.headings.h1.length === t.h1.length);
  add('H2 count', p.headings.h2.length, t.h2Count, within(p.headings.h2.length, t.h2Count, 0.1, 2));
  add('images (with src)', p.images.total, t.imagesWithSrc, within(p.images.total, t.imagesWithSrc, 0.15, 3), `DOM has ${t.imagesTotal} <img>, ${t.imagesWithSrc} with a source`);
  // The scanner scores only images with NO alt attribute (alt="" marks a decorative image and is
  // valid), so compare each category with its own ground-truth number, not the sum.
  const scannerNoAlt = p.images.noAltAttribute ?? p.images.missingAlt;
  add('images with no alt attribute', scannerNoAlt, t.imagesNoAltAttr, within(scannerNoAlt, t.imagesNoAltAttr, 0.2, 3));
  if (p.images.emptyAlt !== undefined) add('images with alt="" (decorative)', p.images.emptyAlt, t.imagesEmptyAlt, within(p.images.emptyAlt, t.imagesEmptyAlt, 0.2, 3));
  add('links (scanner total vs real+hash anchors)', p.links.total, `${t.anchors}+${t.hashAnchors} hash`, within(p.links.total, t.anchors, 0.2, 5) || within(p.links.total, t.anchors + t.hashAnchors, 0.2, 5));
  const types = [...(p.structuredData.types || [])].sort();
  const tTypes = [...t.jsonLdTypes].sort();
  const sym = [...types.filter((x) => !tTypes.includes(x)), ...tTypes.filter((x) => !types.includes(x))];
  add('JSON-LD types', types.length, tTypes.length, sym.length === 0, sym.length ? `differs: ${sym.slice(0, 6).join(', ')}` : undefined);
  add('visible words (rendered)', p.wordCount ?? '-', t.words, within(p.wordCount ?? 0, t.words, 0.3, 30), 'innerText vs markup count differ for hidden text; tolerance 30%');
  add('hreflang present', (p.hreflang || []).length > 0, t.hreflang.length > 0, ((p.hreflang || []).length > 0) === (t.hreflang.length > 0));

  const rvr = f.rawVsRendered;
  if (rvr && g.noJs) {
    add('raw words (no JS)', rvr.rawWords, g.noJs.words, within(rvr.rawWords, g.noJs.words, 0.35, 40), 'ground truth = real load with JavaScript disabled');
    add('raw links (no JS)', rvr.rawLinks, g.noJs.anchors, within(rvr.rawLinks, g.noJs.anchors, 0.3, 4));
    add('rendered words (facts)', rvr.renderedWords, t.words, within(rvr.renderedWords, t.words, 0.3, 30));
  } else if (!rvr) add('raw vs rendered', 'not collected', 'collected', false);

  add('robots.txt blocks all', !!c.robotsBlocksAll, g.http.robotsDisallowAll, !!c.robotsBlocksAll === g.http.robotsDisallowAll);
  const sitemapTruth = g.http.sitemapXmlStatus === 200 || !!g.http.robotsSitemapDirective;
  add('sitemap found', !!c.sitemapFound, sitemapTruth, !!c.sitemapFound === sitemapTruth, `sitemap.xml HTTP ${g.http.sitemapXmlStatus}, robots directive ${g.http.robotsSitemapDirective ? 'yes' : 'no'}`);
  const llmsTruth = g.http.llmsStatus === 200 && !g.http.llmsLooksLikeHtml;
  add('llms.txt found', !!c.llmsTxtFound, llmsTruth, !!c.llmsTxtFound === llmsTruth, `llms.txt HTTP ${g.http.llmsStatus}${g.http.llmsLooksLikeHtml ? ' (HTML, not a real llms.txt)' : ''}`);

  const sh = c.securityHeaders, tsh = g.securityHeaders;
  if (sh && tsh) {
    for (const [k, tk] of [['hsts', 'hsts'], ['csp', 'csp'], ['xFrameOptions', 'xFrame'], ['xContentTypeOptions', 'xcto'], ['referrerPolicy', 'referrer']] as const) {
      add(`header ${k}`, (sh as any)[k], (tsh as any)[tk], (sh as any)[k] === (tsh as any)[tk]);
    }
  }

  const bots = f.botAccess;
  if (bots) {
    for (const b of bots.results) {
      const gs = g.bots?.[b.name];
      if (gs === undefined) continue;
      const gBlocked = g.http.baseline < 400 && REFUSAL.has(gs);
      add(`bot ${b.name}`, `${b.status}${b.blocked ? ' blocked' : ''}`, `${gs}${gBlocked ? ' blocked' : ''}`, b.blocked === gBlocked, b.blocked !== gBlocked ? 'bot rules can vary run to run; re-check' : undefined);
    }
  }
  return rows;
}

/** Assertions inside a written finding that can be checked against ground truth. */
function claimIssues(text: string, g: any, r: any): string[] {
  const t = g.rendered;
  if (!t) return [];
  const low = text.toLowerCase();
  const out: string[] = [];
  const absent = (what: string) => new RegExp(`(?:no|missing|lacks?|without|absent|not (?:found|present|declared)|empty)[^.;]{0,30}${what}|${what}[^.;]{0,25}(?:is|are) (?:missing|absent|empty|not (?:present|found|declared))`).test(low);
  const caution = /(do not|don't|unless|only if|if and only|if genuine|if you|should you|when you|if applicable|if needed|if available)/.test(low);

  if (/\balt[ -]?(text|attribute)/.test(low) && t.imagesWithSrc === 0 && !caution) out.push('mentions alt text but the page has no images');
  if (absent('canonical') && t.canonical) out.push(`says canonical is missing but the page has ${t.canonical}`);
  if (absent('meta description') && t.description) out.push('says meta description is missing but the page has one');
  if (absent('(?:an? )?h1') && t.h1.length > 0 && !/multiple|more than one|several|two/.test(low)) out.push(`says there is no H1 but the page has ${t.h1.length}`);
  if (absent('viewport') && t.viewport) out.push('says viewport is missing but the page has one');
  if (absent('hreflang') && t.hreflang.length > 0) out.push(`says hreflang is missing but the page has ${t.hreflang.length}`);
  if (absent('sitemap') && (g.http.sitemapXmlStatus === 200 || g.http.robotsSitemapDirective)) out.push('says sitemap is missing but one exists');
  if (absent('llms\\.txt') && g.http.llmsStatus === 200 && !g.http.llmsLooksLikeHtml) out.push('says llms.txt is missing but it exists');
  if (absent('(?:json-?ld|structured data|schema)') && t.jsonLdTypes.length > 0 && !/(additional|more|other|beyond|expand|extend|richer|further|specific)/.test(low)) out.push(`says structured data is missing but the page has ${t.jsonLdTypes.length} type(s)`);
  if (absent('(?:hsts|strict-transport)') && g.securityHeaders?.hsts) out.push('says HSTS is missing but the response has it');
  if (absent('(?:content-security-policy|csp)') && g.securityHeaders?.csp) out.push('says CSP is missing but the response has it');
  for (const type of t.jsonLdTypes) {
    if (new RegExp(`(?:no|missing|lacks?|without|add)[^.;]{0,20}\\b${type.toLowerCase()}\\b`).test(low) && /schema|markup|structured|json/.test(low) && !caution && /\b(no|missing|lacks?|without)\b/.test(low)) out.push(`mentions ${type} as missing but the page declares it`);
  }
  // Numbers the finding quotes about words/links/images.
  for (const m of low.matchAll(/(\d[\d,]*)\s+(?:visible\s+|rendered\s+|raw\s+)?words/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    const ok = [t.words, g.noJs?.words, r.crawl.facts?.rawVsRendered?.rawWords, r.crawl.facts?.rawVsRendered?.renderedWords, r.crawl.mainPage.wordCount].some((x) => typeof x === 'number' && within(n, x, 0.3, 30));
    if (!ok && n > 20) out.push(`quotes ${n} words; measured values are ${t.words} rendered / ${g.noJs?.words ?? '?'} no-JS`);
  }
  for (const m of low.matchAll(/(\d[\d,]*)\s+images/g)) {
    const n = Number(m[1].replace(/,/g, ''));
    if (!within(n, t.imagesTotal, 0.25, 3) && !within(n, t.imagesWithSrc, 0.25, 3) && !within(n, t.imagesNoAltAttr + t.imagesEmptyAlt, 0.25, 3)) out.push(`quotes ${n} images; page has ${t.imagesTotal} (${t.imagesNoAltAttr + t.imagesEmptyAlt} without useful alt)`);
  }
  // Crawler claims.
  for (const [name, status] of Object.entries<number>(g.bots || {})) {
    const n = name.toLowerCase();
    const blocked = g.http.baseline < 400 && REFUSAL.has(status);
    if (low.includes(n) && /(blocked|refus|403|denied)/.test(low) && !blocked && !caution) out.push(`says ${name} is blocked but it got HTTP ${status}`);
  }
  return out;
}

const summary: string[] = [];
const totals = { sites: 0, measurementMismatch: 0, claimFlags: 0, simulated: 0, failed: 0, offline: 0 };

for (const e of urls) {
  const r = read('results', e.id);
  const g = read('ground', e.id);
  if (!r || !g) { summary.push(`| ${e.id} | missing ${!r ? 'result' : ''} ${!g ? 'ground truth' : ''} | | | |`); continue; }
  totals.sites++;
  const md: string[] = [`# ${e.id} — ${e.url}`, '', `*${e.kind}.* ${e.why}.`, ''];

  if (!r.ok) {
    totals.failed++;
    md.push(`**Scan failed:** ${r.error}`, '');
    fs.writeFileSync(path.join(outDir, `${e.id}.md`), md.join('\n'));
    summary.push(`| ${e.id} | FAILED | | | ${String(r.error).slice(0, 60)} |`);
    continue;
  }

  const offline = (r.events || []).some((x: any) => x.stage === 'ai' && /OFFLINE/.test(x.msg));
  if (offline) totals.offline++;
  if (r.crawl.hasSimulatedData) totals.simulated++;
  const rows = measurements(r, g);
  const bad = rows.filter((x) => !x.ok);
  totals.measurementMismatch += bad.length;

  md.push(`Scan: ${r.seconds}s · scoreMethod **${r.report.scoreMethod}** · scores ${JSON.stringify(r.report.score)} · simulated: ${r.crawl.hasSimulatedData} · AI used: ${!offline}`, '');
  md.push('## Measurements vs independent ground truth', '', '| Fact | Scanner | Ground truth | |', '|---|---|---|---|');
  for (const x of rows) md.push(`| ${x.fact} | ${x.scanner} | ${x.truth}${x.note ? ` <br><sub>${x.note}</sub>` : ''} | ${x.ok ? 'ok' : '**MISMATCH**'} |`);
  md.push('');

  md.push('## Findings (as shown to the user)', '');
  const findings: Array<{ kind: string; text: string }> = [
    ...r.report.criticalIssues.map((t: string) => ({ kind: 'critical', text: t })),
    ...r.report.recommendedFixes.map((f: any) => ({ kind: `fix [${f.priority}/${f.category}]`, text: `${f.title}. ${f.description} ${f.remediation}` }))
  ];
  let flags = 0;
  findings.forEach((f, i) => {
    const issues = claimIssues(f.text, g, r);
    flags += issues.length;
    md.push(`${i + 1}. **${f.kind}** ${f.text.slice(0, 420)}${f.text.length > 420 ? '…' : ''}`);
    for (const x of issues) md.push(`   - ⚠ ${x}`);
  });
  totals.claimFlags += flags;
  md.push('', `Removed by the checker (${r.report.qa?.removed.length ?? 0}): ${(r.report.qa?.removed || []).map((x: any) => `"${x.title.slice(0, 50)}" (${x.reason.slice(0, 50)})`).join('; ') || 'none'}`);
  md.push(`Added by the checker: ${(r.report.qa?.added || []).join('; ') || 'none'}`, '');
  md.push('## Reviewer verdict', '', '_to be completed by a human reviewer_', '');
  fs.writeFileSync(path.join(outDir, `${e.id}.md`), md.join('\n'));
  summary.push(`| ${e.id} | ${r.report.score.overall} | ${bad.length} | ${flags} | ${offline ? 'OFFLINE ' : ''}${r.crawl.hasSimulatedData ? 'SIMULATED ' : ''}${bad.slice(0, 3).map((x) => x.fact).join(', ')} |`);
}

const sm = ['# Accuracy run summary', '', `Run date: ${date}. ${totals.sites} sites. Measurement mismatches: ${totals.measurementMismatch}. Flagged claims: ${totals.claimFlags}. Simulated: ${totals.simulated}. Offline (AI failed): ${totals.offline}. Failed: ${totals.failed}.`, '',
  '| Site | Overall | Measurement mismatches | Flagged claims | Notes (first mismatches) |', '|---|---|---|---|---|', ...summary, ''];
fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), sm.join('\n'));
console.log(sm.slice(0, 3).join('\n'));
