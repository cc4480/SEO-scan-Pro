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

export function isRefusal(status: number, baselineStatus: number): boolean {
  if (baselineStatus >= 400) return false; // the site refuses everyone, so it is not a crawler-specific block
  return status === 0 || REFUSAL.has(status);
}

async function fetchAs(url: string, userAgent: string): Promise<number> {
  try {
    const res = await safeFetch(url, { headers: { 'User-Agent': userAgent, Accept: 'text/html,*/*' }, timeoutMs: 5000, maxBytes: 64 * 1024, maxRedirects: 3 });
    return res.status;
  } catch {
    return 0;
  }
}

/**
 * Requests the page once per crawler, with that crawler's published user agent, and compares the
 * answer with what a normal request got and with what robots.txt says. A site can publish
 * "everyone is welcome" in robots.txt and still refuse the crawler at the CDN; only a request
 * shows that.
 */
export async function checkBotAccess(origin: string, robotsText: string | null, baselineStatus: number, emit: Emit): Promise<BotAccess> {
  const url = `${origin}/`;
  emit('llms', 'start', `requesting ${clip(url, 60)} as ${BOTS.length} search, assistant and AI-training crawlers`);

  const results: BotAccessResult[] = [];
  // Small batches keep this polite and fast: a handful of requests at a time, not 13 at once.
  for (let i = 0; i < BOTS.length; i += 5) {
    const batch = BOTS.slice(i, i + 5);
    const statuses = await Promise.all(batch.map((b) => fetchAs(url, b.userAgent)));
    batch.forEach((bot, n) => {
      const status = statuses[n];
      results.push({
        name: bot.name,
        role: bot.role,
        status,
        blocked: isRefusal(status, baselineStatus),
        robotsAllows: robotsText === null ? null : robotsAllows(robotsText, bot.token, '/')
      });
    });
  }

  const conflicts = results.filter((r) => r.blocked && r.robotsAllows !== false).map((r) => r.name);

  for (const r of results) {
    const label = r.role === 'training' ? 'AI training' : r.role === 'search' ? 'search' : 'assistant';
    emit('llms', r.blocked ? 'warn' : 'info', `${r.name} (${label}) → ${r.status === 0 ? 'no response' : `HTTP ${r.status}`}${r.blocked ? ' — BLOCKED' : ''}`);
  }
  const blockedSearch = results.filter((r) => r.blocked && r.role !== 'training').map((r) => r.name);
  const blockedTraining = results.filter((r) => r.blocked && r.role === 'training').map((r) => r.name);
  if (blockedSearch.length) emit('llms', 'warn', `search/assistant crawlers refused: ${blockedSearch.join(', ')}`);
  if (blockedTraining.length) emit('llms', 'info', `AI-training crawlers refused: ${blockedTraining.join(', ')} (often a deliberate CDN setting)`);
  if (conflicts.length) emit('llms', 'warn', `robots.txt allows but the site refuses: ${conflicts.join(', ')}`);
  if (!blockedSearch.length && !blockedTraining.length) emit('llms', 'ok', `all ${results.length} crawlers received the page`);

  return { checkedUrl: url, baselineStatus, results, conflicts };
}
