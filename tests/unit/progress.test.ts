import { describe, it, expect, vi, afterEach } from 'vitest';
import { openProgress, getProgress, closeProgress, clip, type ProgressEvent } from '../../lib/progress';
import { describePage, parsePage, crawlUrl } from '../../lib/crawler';
import type { CrawlResult } from '../../src/types';

const collect = () => {
  const events: Array<Pick<ProgressEvent, 'stage' | 'level' | 'msg'>> = [];
  return { events, emit: (stage: string, level: any, msg: string) => events.push({ stage, level, msg }) };
};

describe('progress store', () => {
  it('records events in order with a running index and elapsed time', () => {
    const p = openProgress('scan-order', 'u1');
    p.emit('url', 'start', 'a');
    p.emit('url', 'ok', 'b');
    const list = p.events();
    expect(list.map((e) => [e.i, e.stage, e.level, e.msg])).toEqual([[0, 'url', 'start', 'a'], [1, 'url', 'ok', 'b']]);
    expect(list[1].t).toBeGreaterThanOrEqual(list[0].t);
  });

  it('is idempotent per scan, so a queued scan and its later run share one log', () => {
    const a = openProgress('scan-idem', 'u1');
    a.emit('scan', 'info', 'queued');
    const b = openProgress('scan-idem', 'u1');
    b.emit('scan', 'start', 'started');
    expect(a.events()).toHaveLength(2);
  });

  it('only serves a log to the user who owns the scan, and supports ?after=', () => {
    const p = openProgress('scan-owner', 'owner');
    ['x', 'y', 'z'].forEach((m) => p.emit('url', 'info', m));
    expect(getProgress('scan-owner', 'someone-else')).toBeNull();
    expect(getProgress('scan-owner', 'owner', 1)!.map((e) => e.msg)).toEqual(['y', 'z']);
    expect(getProgress('scan-owner', 'owner', 99)).toEqual([]);
    expect(getProgress('no-such-scan', 'owner')).toBeNull();
  });

  it('caps message length and event count so a hostile site cannot bloat the log', () => {
    const p = openProgress('scan-cap', 'u1');
    p.emit('meta', 'info', 'x'.repeat(5000));
    expect(p.events()[0].msg.length).toBeLessThanOrEqual(300);
    for (let i = 0; i < 600; i++) p.emit('meta', 'info', `line ${i}`);
    expect(p.events().length).toBe(400);
  });

  it('clip flattens newlines and truncates text taken from the scanned site', () => {
    expect(clip('a\nb\tc', 10)).toBe('a b c');
    expect(clip('abcdefghij', 5)).toBe('abcd…');
    expect(clip(null)).toBe('');
  });

  it('closeProgress keeps the log readable for late pollers', () => {
    const p = openProgress('scan-close', 'u1');
    p.emit('scan', 'ok', 'done');
    closeProgress('scan-close');
    expect(getProgress('scan-close', 'u1')).toHaveLength(1);
  });
});

describe('describePage reports only measured values', () => {
  const html = `<html lang="en"><head><title>Acme Widgets</title><meta name="description" content="We make widgets.">
    <meta property="og:title" content="Acme"><link rel="canonical" href="https://acme.test/"></head>
    <body><h1>Widgets</h1><h2>A</h2><h2>B</h2><img src="a.png"><img src="b.png" alt="b"><a href="/x">x</a><a href="https://o.test/">o</a></body></html>`;
  const page = parsePage('https://acme.test/', html, 321, 120);

  it('logs each real finding under its stage, flagging gaps as warnings', () => {
    const { events, emit } = collect();
    describePage(page, emit, { https: true, hsts: false, csp: false, xFrameOptions: false, xContentTypeOptions: true, referrerPolicy: false });
    const by = (stage: string) => events.filter((e) => e.stage === stage);

    expect(by('meta').some((e) => e.level === 'ok' && e.msg.includes('"Acme Widgets"') && e.msg.includes('12 chars'))).toBe(true);
    expect(by('meta').some((e) => e.level === 'warn' && /viewport meta MISSING/.test(e.msg))).toBe(true);
    expect(by('meta').some((e) => e.level === 'warn' && /Open Graph missing: description, image/.test(e.msg))).toBe(true);
    expect(by('headings').some((e) => /H1 ×1: "Widgets"/.test(e.msg))).toBe(true);
    expect(by('images').some((e) => e.level === 'warn' && e.msg === '2 image(s), 1 without alt text')).toBe(true);
    expect(by('links').some((e) => e.msg === '2 link(s): 1 internal, 1 external')).toBe(true);
    expect(by('schema').some((e) => e.level === 'warn' && /no JSON-LD/.test(e.msg))).toBe(true);
    expect(by('security').filter((e) => e.level === 'warn')).toHaveLength(4);
    expect(by('security').find((e) => e.level === 'done')!.msg).toBe('4 of 6 missing');
    expect(by('perf').some((e) => e.msg.startsWith('load 321ms · TTFB 120ms'))).toBe(true);
  });

  it('closes every stage it opens, so the UI can mark them complete', () => {
    const { events, emit } = collect();
    describePage(page, emit, { https: true, hsts: true, csp: true, xFrameOptions: true, xContentTypeOptions: true, referrerPolicy: true });
    for (const stage of ['meta', 'headings', 'images', 'schema', 'security', 'perf']) {
      expect(events.filter((e) => e.stage === stage && e.level === 'start'), stage).toHaveLength(1);
      expect(events.filter((e) => e.stage === stage && e.level === 'done'), stage).toHaveLength(1);
    }
  });

  it('never states a lab vital it does not have', () => {
    const { events, emit } = collect();
    describePage({ ...page, webVitals: undefined }, emit);
    expect(events.some((e) => /LCP|CLS/.test(e.msg) && e.level !== 'info')).toBe(false);
    expect(events.some((e) => /no LCP\/CLS entries/.test(e.msg))).toBe(true);
  });
});

describe('crawlUrl logs the truth when it cannot proceed', () => {
  it('records a failed resolution instead of inventing progress', async () => {
    const { events, emit } = collect();
    await expect(crawlUrl('https://this-domain-definitely-does-not-exist-abc123xyz.test', 'SINGLE', 1, emit)).rejects.toThrow();
    expect(events[0]).toMatchObject({ stage: 'url', level: 'start' });
    expect(events.some((e) => e.stage === 'url' && e.level === 'fail')).toBe(true);
    expect(events.some((e) => e.stage === 'render')).toBe(false); // never got as far as rendering
  }, 20000);

  it('logs an SSRF refusal as a failure with the reason', async () => {
    const { events, emit } = collect();
    await expect(crawlUrl('http://169.254.169.254/latest', 'SINGLE', 1, emit)).rejects.toThrow();
    const fail = events.find((e) => e.level === 'fail');
    expect(fail?.msg).toMatch(/refused/);
  });
});

describe('DeepSeek step logs which engine actually wrote the report', () => {
  const crawl = (): CrawlResult => ({
    rootUrl: 'https://x.test/', mode: 'SINGLE', depth: 1, timestamp: '', additionalPages: [], sitemapFound: true,
    llmsTxtFound: false, hasSimulatedData: false,
    mainPage: parsePage('https://x.test/', '<html lang="en"><head><title>T</title></head><body><h1>H</h1></body></html>', 100)
  });
  const saved = process.env.DEEPSEEK_API_KEY;
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
    if (saved === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = saved;
  });

  const load = async (key: string | undefined) => {
    if (key === undefined) delete process.env.DEEPSEEK_API_KEY; else process.env.DEEPSEEK_API_KEY = key;
    vi.resetModules();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    return (await import('../../lib/deepseek')).generateSeoReport;
  };

  it('says plainly that no AI model was used when there is no API key', async () => {
    const generate = await load(undefined);
    const { events, emit } = collect();
    await generate(crawl(), emit);
    const warn = events.find((e) => e.stage === 'ai' && e.level === 'warn');
    expect(warn?.msg).toMatch(/OFFLINE generator/);
    expect(events.find((e) => e.stage === 'prompt' && e.level === 'ok')?.msg).toMatch(/built locally/);
  });

  it('logs the request and reply, then the model-written brief, when DeepSeek succeeds', async () => {
    const generate = await load('sk-real-looking-key');
    const report = {
      score: { overall: 71, technical: 60, content: 70, aeoGeo: 80, performance: 90 },
      executiveSummary: 's', criticalIssues: ['one'], recommendedFixes: [{ title: 't', category: 'technical', priority: 'high', description: 'd', remediation: 'r' }],
      aeoAssessment: { generativeFriendlinessScore: 1, directAnswerFriendliness: '', richSnippetEligibility: [], voiceSearchOptimized: false, recommendationsForAeo: [] },
      agentReadyPrompt: { title: 'Fix it', prompt: 'Do the thing', checklist: ['a', 'b'] }
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(report) } }] }) }));
    const { events, emit } = collect();
    const out = await generate(crawl(), emit);

    // The model's own numbers (71) are discarded: scores are computed from the measured crawl.
    expect(out.scoreMethod).toBe('measured');
    expect(out.score.overall).not.toBe(71);
    const ai = events.filter((e) => e.stage === 'ai').map((e) => e.msg);
    expect(ai.some((m) => /scores computed from the measured checks/.test(m))).toBe(true);
    expect(ai.some((m) => /sending .*KB crawl payload to deepseek-flash/.test(m))).toBe(true);
    expect(ai.some((m) => /DeepSeek accepted the request \(HTTP 200\) after/.test(m))).toBe(true);
    expect(ai.some((m) => /full report received after/.test(m))).toBe(true);
    expect(ai.some((m) => m === `scores: overall ${out.score.overall} · technical ${out.score.technical} · content ${out.score.content} · AEO/GEO ${out.score.aeoGeo} · performance ${out.score.performance}`)).toBe(true);
    // The hand-off brief is rebuilt from the checked report so it cannot repeat anything that was removed.
    expect(events.find((e) => e.stage === 'prompt' && e.level === 'ok')?.msg).toMatch(/^hand-off brief rebuilt from the checked report \(\d+ chars, \d+ checklist item\(s\)\)$/);
    expect(events.some((e) => /OFFLINE/.test(e.msg))).toBe(false);
  });

  it('admits the fallback (and that the report is not AI-written) when DeepSeek fails', async () => {
    const generate = await load('sk-real-looking-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'overloaded' }));
    const { events, emit } = collect();
    await generate(crawl(), emit);
    const warn = events.find((e) => e.stage === 'ai' && e.level === 'warn');
    expect(warn?.msg).toMatch(/DeepSeek failed .*503/);
    expect(warn?.msg).toMatch(/NOT AI-written/);
  });

  it('never writes the API key into the log', async () => {
    const generate = await load('sk-super-secret-value');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const { events, emit } = collect();
    await generate(crawl(), emit);
    expect(JSON.stringify(events)).not.toContain('sk-super-secret-value');
  });
});
