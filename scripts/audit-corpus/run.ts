/**
 * Runs the real audit pipeline (crawlUrl + generateSeoReport, exactly what a scan does) over the
 * accuracy corpus and saves each result to audit-corpus/results/<id>.json.
 *
 *   npx tsx scripts/audit-corpus/run.ts            # every URL
 *   npx tsx scripts/audit-corpus/run.ts 05 12      # only ids starting with 05 or 12
 *
 * Needs DEEPSEEK_API_KEY in .env to exercise the AI step (otherwise the offline generator runs).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { crawlUrl } from '../../lib/crawler';
import { generateSeoReport } from '../../lib/deepseek';
import { closeBrowser } from '../../lib/browser';
import type { ProgressEvent } from '../../src/types';

interface Entry { id: string; url: string; kind: string; why: string }

const root = path.resolve(process.cwd(), 'audit-corpus');
const outDir = path.join(root, 'results');
fs.mkdirSync(outDir, { recursive: true });

const all: Entry[] = JSON.parse(fs.readFileSync(path.join(root, 'urls.json'), 'utf8'));
const only = process.argv.slice(2);
const todo = only.length ? all.filter((e) => only.some((p) => e.id.startsWith(p))) : all;

async function one(e: Entry): Promise<void> {
  const started = Date.now();
  const events: ProgressEvent[] = [];
  let n = 0;
  const emit = (stage: string, level: any, msg: string) => events.push({ i: n++, t: Date.now() - started, stage, level, msg });
  try {
    const crawl = await crawlUrl(e.url, 'SINGLE', 1, emit);
    const report = await generateSeoReport(crawl, emit);
    fs.writeFileSync(path.join(outDir, `${e.id}.json`), JSON.stringify({ ...e, ok: true, seconds: Math.round((Date.now() - started) / 100) / 10, crawl, report, events }, null, 1));
    console.log(`ok   ${e.id.padEnd(20)} ${((Date.now() - started) / 1000).toFixed(0)}s  overall ${report.score.overall}  simulated=${crawl.hasSimulatedData}`);
  } catch (err: any) {
    fs.writeFileSync(path.join(outDir, `${e.id}.json`), JSON.stringify({ ...e, ok: false, error: String(err?.message || err), events }, null, 1));
    console.log(`FAIL ${e.id.padEnd(20)} ${String(err?.message || err).slice(0, 100)}`);
  }
}

async function main() {
  // Two at a time: the pipeline shares one Chromium, and the sites should not be hammered.
  const queue = [...todo];
  const workers = Array.from({ length: 2 }, async () => {
    for (let e = queue.shift(); e; e = queue.shift()) await one(e);
  });
  await Promise.all(workers);
  await closeBrowser();
  console.log(`done: ${todo.length} site(s) -> ${outDir}`);
  process.exit(0);
}

main();
