import type { BotAccess, BotAccessResult } from '../../src/types';

// What a refused crawler request MEANS. One place, so scoring, the written findings, the evidence
// panel and the downloadable report all agree.
//
//   ok            the crawler got through
//   policy        refused AND robots.txt explicitly disallows it: the site's own policy, enforced. Not an error.
//   inconclusive  refused, but not provably a block: an IP-verified crawler (Googlebot, Bingbot,
//                 Applebot) refusing a spoofed request, or a site that refuses every non-browser client
//   genuine       refused although robots.txt allows it (or says nothing): a real problem

export type BotVerdict = 'ok' | 'policy' | 'inconclusive' | 'genuine';

export function botVerdict(r: BotAccessResult, bots?: Pick<BotAccess, 'baselineRefused'>): BotVerdict {
  if (!r.blocked) return 'ok';
  if (r.inconclusive || bots?.baselineRefused) return 'inconclusive';
  if (r.robotsAllows === false) return 'policy';
  return 'genuine';
}

export function classifyBots(bots: BotAccess) {
  const by = (v: BotVerdict) => bots.results.filter((r) => botVerdict(r, bots) === v);
  const genuine = by('genuine');
  return {
    genuine,
    genuineSearch: genuine.filter((r) => r.role !== 'training'),
    genuineTraining: genuine.filter((r) => r.role === 'training'),
    policy: by('policy'),
    inconclusive: by('inconclusive'),
    inconclusiveSearch: by('inconclusive').filter((r) => r.role !== 'training'),
    /** Conflicts (robots.txt welcomes, site refuses) that are real, not inconclusive. */
    // "robots.txt welcomes it" is only true when robots.txt was readable and said so (robotsAllows === true).
    conflicts: bots.conflicts.filter((n) => genuine.some((r) => r.name === n && r.robotsAllows === true))
  };
}
