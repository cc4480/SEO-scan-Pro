// A small robots.txt evaluator (RFC 9309 semantics): the most specific user-agent group wins, and
// within it the longest matching rule wins, with Allow beating Disallow on a tie. Used to find
// crawlers that robots.txt welcomes but the site refuses anyway.

interface Rule { allow: boolean; pattern: string }
interface Group { agents: string[]; rules: Rule[] }

export function parseRobots(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && current) {
      lastWasAgent = false;
      // An empty Disallow means "allow everything"; an empty Allow is meaningless.
      if (value) current.rules.push({ allow: key === 'allow', pattern: value });
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

const REGEX_SPECIALS = /[\\^$.+?()[\]{}|]/g;

function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body.split('*').map((part) => part.replace(REGEX_SPECIALS, '\\$&')).join('.*');
  return new RegExp('^' + source + (anchored ? '$' : '')).test(path);
}

/** The group that governs `token`: the most specific named group, else the "*" group, else none. */
function groupFor(groups: Group[], token: string): Group | null {
  let best: Group | null = null;
  let bestLen = -1;
  for (const g of groups) {
    for (const a of g.agents) {
      if (a !== '*' && token.includes(a) && a.length > bestLen) { best = g; bestLen = a.length; }
    }
  }
  return best ?? groups.find((g) => g.agents.includes('*')) ?? null;
}

/** True when `agentToken` (e.g. "GPTBot") may fetch `path` under this robots.txt. */
export function robotsAllows(robotsText: string, agentToken: string, path = '/'): boolean {
  const groups = parseRobots(robotsText);
  const best = groupFor(groups, agentToken.toLowerCase());
  if (!best) return true;

  let verdict = true;
  let longest = -1;
  for (const r of best.rules) {
    if (!matches(r.pattern, path)) continue;
    const len = r.pattern.length;
    if (len > longest || (len === longest && r.allow)) { longest = len; verdict = r.allow; }
  }
  return verdict;
}

export type RobotsAccess = 'allowed' | 'partial' | 'disallowed';

// A group that shuts a crawler out of the whole site has a "Disallow: /" and nothing it can reach.
function groupShutsOutAll(g: Group): boolean {
  return g.rules.some((r) => !r.allow && r.pattern === '/') && !g.rules.some((r) => r.allow);
}

/**
 * What robots.txt grants one crawler, using the group that governs it (a named group overrides "*").
 * 'allowed' = the home page may be fetched; 'partial' = the home page is off limits but some paths are
 * explicitly allowed (LinkedIn's named groups for Googlebot and Bingbot); 'disallowed' = nothing is.
 */
export function robotsAccess(robotsText: string, agentToken: string): RobotsAccess {
  if (robotsAllows(robotsText, agentToken, '/')) return 'allowed';
  const g = groupFor(parseRobots(robotsText), agentToken.toLowerCase());
  return g && !groupShutsOutAll(g) ? 'partial' : 'disallowed';
}

/**
 * True only when the whole site is closed to crawlers: the "*" group disallows "/" AND no named crawler
 * group grants any access. A "*" block that named groups carve exceptions out of is NOT "blocks everyone".
 */
export function robotsBlocksEveryone(robotsText: string): boolean {
  const groups = parseRobots(robotsText);
  const star = groups.find((g) => g.agents.includes('*'));
  if (!star || robotsAllows(robotsText, '*', '/')) return false;
  const namedGrantsAccess = groups.some((g) => !g.agents.includes('*') && !groupShutsOutAll(g));
  return !namedGrantsAccess;
}
