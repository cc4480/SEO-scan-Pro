import type { BotAccess, BotAccessResult, BotRole } from '../../src/types';
import { safeFetch } from '../ssrfGuard';
import { clip, type Emit } from '../progress';
import { robotsAllows } from './robotsRules';

// Published user-agent strings of the crawlers that decide whether a site can be found and cited
// by search engines and AI assistants. `token` is the product name robots.txt rules are written
// against. Training crawlers collect text to train models, search crawlers build the indexes that
// answer engines cite from, and assistant crawlers fetch a page when a person asks about it.
interface Bot { name: string; token: string; role: BotRole; userAgent: string }

export const BOTS: Bot[] = [
  { name: 'GPTBot', token: 'GPTBot', role: 'training', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)' },
  { name: 'ClaudeBot', token: 'ClaudeBot', role: 'training', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
  { name: 'CCBot', token: 'CCBot', role: 'training', userAgent: 'CCBot/2.0 (https://commoncrawl.org/faq/)' },
  { name: 'Bytespider', token: 'Bytespider', role: 'training', userAgent: 'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)' },
  { name: 'OAI-SearchBot', token: 'OAI-SearchBot', role: 'search', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot' },
  { name: 'Claude-SearchBot', token: 'Claude-SearchBot', role: 'search', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +searchbot@anthropic.com)' },
  { name: 'PerplexityBot', token: 'PerplexityBot', role: 'search', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)' },
  { name: 'Googlebot', token: 'Googlebot', role: 'search', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { name: 'Bingbot', token: 'bingbot', role: 'search', userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
  { name: 'Applebot', token: 'Applebot', role: 'search', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)' },
  { name: 'ChatGPT-User', token: 'ChatGPT-User', role: 'assistant', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot' },
  { name: 'Claude-User', token: 'Claude-User', role: 'assistant', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)' },
  { name: 'Perplexity-User', token: 'Perplexity-User', role: 'assistant', userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)' }
];

// A reply that means "you may not have this" rather than "this does not exist".
const REFUSAL = new Set([401, 403, 406, 429]);

/** Whether a status means the site turned the client away (or never answered). */
export function isRefused(status: number): boolean {
  return status === 0 || REFUSAL.has(status);
}

export function isRefusal(status: number, baselineStatus: number): boolean {
  if (baselineStatus >= 400 || baselineStatus === 0) return false; // the site refuses everyone, so it is not a crawler-specific block
  return isRefused(status);
}

// Googlebot, Bingbot and Applebot are verified by the vendors through the caller's IP / reverse DNS.
// A site that refuses a spoofed request from a non-crawler IP is doing exactly what it should, so
// that refusal says nothing about the real crawler.
const IP_VERIFIED = new Set(['Googlebot', 'Bingbot', 'Applebot']);

// A normal desktop browser identity: the baseline every crawler is compared against, sent through the
// SAME transport (safeFetch) as the probes so the comparison is like for like.
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Pause before the single retry of a request that got no answer at all.
export const RETRY_DELAY_MS = 400;

/** Any answer that is not a success: a refusal, an odd site-specific code (Hacker News sends 419), a server error or no answer. */
export function isFailed(status: number): boolean {
  return status === 0 || status >= 400;
}

// A 429 is "slow down", usually a rate limit that a moment later no longer applies. Retry-After is
// honoured but capped, so one slow site cannot stall the scan.
const MAX_RETRY_WAIT_MS = 2000;

async function fetchOnce(url: string, userAgent: string): Promise<{ status: number; waitMs: number }> {
  try {
    const res = await safeFetch(url, { headers: { 'User-Agent': userAgent, Accept: 'text/html,*/*' }, timeoutMs: 5000, maxBytes: 64 * 1024, maxRedirects: 3 });
    const ra = Number(res.headers?.['retry-after']);
    const waitMs = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, MAX_RETRY_WAIT_MS) : RETRY_DELAY_MS;
    return { status: res.status, waitMs };
  } catch {
    return { status: 0, waitMs: RETRY_DELAY_MS };
  }
}

/** One transient failure (timeout, reset) or one 429 must not count as a block: each is retried once. */
async function fetchAs(url: string, userAgent: string): Promise<number> {
  const first = await fetchOnce(url, userAgent);
  if (first.status !== 0 && first.status !== 429) return first.status;
  await new Promise((r) => setTimeout(r, first.waitMs));
  return (await fetchOnce(url, userAgent)).status;
}

/**
 * Requests the page once per crawler, with that crawler's published user agent, and compares the
 * answer with what a normal request got and with what robots.txt says. A site can publish
 * "everyone is welcome" in robots.txt and still refuse the crawler at the CDN; only a request
 * shows that.
 */
export async function checkBotAccess(origin: string, robotsText: string | null, renderedStatus: number, emit: Emit): Promise<BotAccess> {
  const url = `${origin}/`;
  emit('llms', 'start', `requesting ${clip(url, 60)} as ${BOTS.length} search, assistant and AI-training crawlers`);

  // The baseline is one more plain request, not the Chromium render status: a site can serve a real
  // browser and refuse every other client, and only the same transport as the probes shows that.
  const baselineStatus = await fetchAs(url, BROWSER_UA);
  const baselineRefused = isFailed(baselineStatus);
  if (baselineRefused) {
    emit('llms', 'warn', `a normal browser-style request was refused too (${baselineStatus === 0 ? 'no response' : `HTTP ${baselineStatus}`}${renderedStatus < 400 ? `, although the rendered browser got HTTP ${renderedStatus}` : ''}): this site turns away automated clients in general, so the crawler results below cannot show a block aimed at one crawler`);
  }

  const results: BotAccessResult[] = [];
  // Small batches keep this polite and fast: a handful of requests at a time, not 13 at once.
  for (let i = 0; i < BOTS.length; i += 5) {
    const batch = BOTS.slice(i, i + 5);
    const statuses = await Promise.all(batch.map((b) => fetchAs(url, b.userAgent)));
    batch.forEach((bot, n) => {
      const status = statuses[n];
      // Refused is not the same as blocked: see IP_VERIFIED and baselineRefused above. Only the
      // recognised refusals (401/403/406/429) and a persistent no-response can be a block; any other
      // error code (419, 5xx, 404) is odd but proves nothing about this crawler.
      const refused = isFailed(status);
      const inconclusive = refused && (baselineRefused || IP_VERIFIED.has(bot.name) || !isRefused(status));
      results.push({
        name: bot.name,
        role: bot.role,
        status,
        blocked: refused && !inconclusive,
        inconclusive,
        robotsAllows: robotsText === null ? null : robotsAllows(robotsText, bot.token, '/')
      });
    });
  }

  // Every crawler refused while a browser got in: a look-alike User-Agent from a non-crawler address is
  // turned away by design (Hacker News answers all of them with 419), so no single refusal is
  // provably aimed at that crawler.
  const allRefused = !baselineRefused && results.length > 0 && results.every((r) => isFailed(r.status));
  if (allRefused) for (const r of results) { r.blocked = false; r.inconclusive = true; }

  const conflicts = results.filter((r) => r.blocked && r.robotsAllows !== false).map((r) => r.name);

  for (const r of results) {
    const label = r.role === 'training' ? 'AI training' : r.role === 'search' ? 'search' : 'assistant';
    const answer = r.status === 0 ? 'no response (tried twice)' : `HTTP ${r.status}`;
    const why = baselineRefused ? ' — refused, but so is every non-browser client'
      : allRefused ? ' — refused, but every crawler look-alike was refused while a browser got in, so this is not proof of a block against this crawler'
      : IP_VERIFIED.has(r.name) && isRefused(r.status) ? ' — refused; this crawler is verified by IP address, so a refusal of our look-alike request is expected and proves nothing'
      : ' — an unusual error code, not a recognised refusal, so it is not counted as a block';
    const note = r.blocked ? ' — BLOCKED' : r.inconclusive ? why : '';
    emit('llms', r.blocked ? 'warn' : 'info', `${r.name} (${label}) → ${answer}${note}`);
  }
  const blockedSearch = results.filter((r) => r.blocked && r.role !== 'training').map((r) => r.name);
  const blockedTraining = results.filter((r) => r.blocked && r.role === 'training').map((r) => r.name);
  const unclear = results.filter((r) => r.inconclusive).map((r) => r.name);
  if (blockedSearch.length) emit('llms', 'warn', `search/assistant crawlers refused: ${blockedSearch.join(', ')}`);
  if (blockedTraining.length) emit('llms', 'info', `AI-training crawlers refused: ${blockedTraining.join(', ')} (often a deliberate CDN setting)`);
  if (conflicts.length) emit('llms', 'warn', `robots.txt allows but the site refuses: ${conflicts.join(', ')}`);
  if (allRefused) emit('llms', 'warn', `all ${results.length} crawler look-alikes were refused (HTTP ${[...new Set(results.map((r) => r.status))].join('/')}) while a normal browser got the page: the site turns away requests that claim to be a crawler but come from an unverified address. This does not show that the real crawlers are blocked`);
  else if (unclear.length && !baselineRefused) emit('llms', 'info', `could not be verified from here (the real crawler may still get in): ${unclear.join(', ')}`);
  if (!blockedSearch.length && !blockedTraining.length && !unclear.length) emit('llms', 'ok', `all ${results.length} crawlers received the page`);

  return { checkedUrl: url, baselineStatus, baselineRefused, unreadableRobots: robotsText === null, results, conflicts };
}
