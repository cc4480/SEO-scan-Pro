import { findTags, textOf } from './htmlFacts';

// Detects when the page a scan received is a bot challenge or an "unsupported client" interstitial
// instead of the site. Auditing that page produces a report about the wall, not the site (Canva
// served "Unsupported client - Canva", H1 "Please update your browser", robots noindex,nofollow, and
// was scored as if that were its homepage). Conservative on purpose: a false "this is a challenge"
// hides a real audit, so every rule needs either a challenge-specific title or a challenge phrase on
// a page with almost no content.

export interface ChallengeInput {
  status?: number;
  title: string;
  h1: string[];
  /** The page's visible text (or any leading sample of it). */
  bodyText: string;
  robots?: string;
}

// A title that IS the wall. Anchored at the start so "How to fix Access Denied errors" does not match.
const CHALLENGE_TITLE = [
  /^just a moment\b/i,
  /^attention required\b/i,
  /^access denied\b/i,
  /^unsupported (client|browser)\b/i,
  /^checking your browser\b/i,
  /^(please )?verify (that )?you are (a )?human\b/i,
  /^are you a (robot|human)\b/i,
  /^robot or human\b/i,
  /^human verification\b/i,
  /^security check\b/i,
  /^pardon our interruption\b/i,
  /^(you have been|request) blocked\b/i,
  /^one more step\b/i,
  /^ddos protection by\b/i,
  /^bot verification\b/i
];

/** True when a page title is the wording of a bot-check or blocked page. */
export const isChallengeTitle = (title: string): boolean => CHALLENGE_TITLE.some((re) => re.test(title.trim()));

// Wording of the wall itself. Only trusted when the page has almost no other content.
const CHALLENGE_BODY = [
  /checking (if the site connection is secure|your browser before accessing)/i,
  /verify(ing)? (that )?you are (a )?human/i,
  /verify that you(?:'|’)?re not a robot/i,
  /enable javascript and cookies to continue/i,
  /performing security verification/i,
  /needs to review the security of your connection/i,
  /press (and|&) hold to confirm you are a human/i,
  /please (complete|solve) the (captcha|security check)/i,
  /unusual traffic from your (computer|network)/i,
  /please update your browser/i,
  /your browser is (not supported|out of date)/i,
  /you (don't|do not) have permission to access/i,
  /request (was )?blocked/i,
  /\bcaptcha\b/i,
  /ddos protection/i
];

const WALL_MAX_WORDS = 150;

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** A short reason when the page is a challenge / interstitial, otherwise null. */
export function classifyChallenge(page: ChallengeInput): string | null {
  const title = page.title.trim();
  const titleHit = CHALLENGE_TITLE.find((re) => re.test(title));
  if (titleHit) return `the page title is "${title.slice(0, 80)}", the wording of a bot-check or blocked page`;

  const body = page.bodyText.trim();
  const h1 = page.h1.join(' ');
  const thin = words(body) <= WALL_MAX_WORDS;
  if (!thin) return null;

  // The wall's own wording in the heading or the (tiny) body.
  const phrase = CHALLENGE_BODY.find((re) => re.test(h1) || re.test(body));
  if (phrase) return `the page is only ${words(body)} words and says "${(body.match(phrase) || h1.match(phrase) || [''])[0].slice(0, 80)}", the wording of a bot-check or blocked page`;

  // A refusal status plus an emptied-out noindex page is a wall even when it uses its own words.
  const noindex = /noindex/i.test(page.robots || '');
  if ((page.status === 403 || page.status === 429 || page.status === 503) && noindex && words(body) <= 60) {
    return `HTTP ${page.status} with noindex and only ${words(body)} words of content`;
  }
  return null;
}

/**
 * Same question for a plain HTTP response body (no browser). Adds the shapes a script-less client is
 * given that a browser never sees: a bare meta-refresh to a verification URL (Amazon: a 2 KB page
 * whose only content is `<meta http-equiv="refresh" content="5; URL='/?bm-verify=...'">`) and an
 * empty HTTP 202 "come back later" answer.
 */
export function classifyRawResponse(html: string, status: number): string | null {
  const text = textOf(html, true);
  const nWords = words(text);
  const title = textOf((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '', false);
  const h1 = findTags(html, 'h1').map((t) => textOf(html.slice(t.end).split(/<\/h1/i)[0], false));
  const fromText = classifyChallenge({ status, title, h1, bodyText: text });
  if (fromText) return fromText;
  // Any refusal or error answer to the plain request is not the page, whatever it says.
  if (status >= 400) return `HTTP ${status}: the plain request was refused or failed`;

  const refresh = findTags(html, 'meta').find((t) => /^refresh$/i.test(t.attrs['http-equiv'] || ''));
  if (refresh && nWords <= 30 && /verify|captcha|challenge|bm-|cf_chl|__cf|\/cdn-cgi\//i.test(refresh.attrs.content || '')) {
    return `the response is a ${nWords}-word page that only redirects to a verification URL`;
  }
  if (status === 202 && nWords <= 10) return `HTTP 202 with only ${nWords} words: the site answered "not yet" instead of the page`;
  return null;
}
