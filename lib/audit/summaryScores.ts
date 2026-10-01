import type { DeepSeekSeoReport } from '../../src/types';

// The model writes its summary before the scores are computed, so it can quote numbers ("overall 88,
// technical 92") that disagree with the scores the user sees. The computed scores are the truth:
// any score the summary quotes is rewritten to match.

const LABELS: Array<[RegExp, keyof DeepSeekSeoReport['score']]> = [
  [/overall|total|combined/, 'overall'],
  [/technical/, 'technical'],
  [/content/, 'content'],
  [/aeo|geo|ai[- ]search|generative/, 'aeoGeo'],
  [/performance|speed/, 'performance']
];

// "overall 88", "technical score of 92", "content: 86/100". The number must not be a measurement
// ("883 words", "719 ms", "49 links"), so units after it exclude the match.
const MENTION = /\b(overall|total|combined|technical|content|aeo\/geo|aeo|geo|ai[- ]search|generative|performance|speed)(\s+(?:health\s+)?(?:score|rating|grade)?\s*(?:of|is|at|:|=|-)?\s*)(\d{1,3})(\s*\/\s*100)?(?!\d)(?!\s*(?:words?|ms|milliseconds?|seconds?|s\b|kb|mb|%|links?|images?|requests?|px|characters?|chars?|pages?|checks?|stages?))/gi;

export function reconcileScoreMentions(text: string, score: DeepSeekSeoReport['score']): string {
  if (!text) return text;
  return text.replace(MENTION, (whole, label: string, gap: string, num: string, slash: string | undefined) => {
    const key = LABELS.find(([re]) => re.test(label.toLowerCase()))?.[1];
    if (!key) return whole;
    const actual = score[key];
    if (typeof actual !== 'number' || Number(num) === actual) return whole;
    // A bare small number after "content" is rarely a score ("content 3 sections"): only rewrite
    // plausible scores, or any number that carries "/100".
    if (!slash && Number(num) < 20) return whole;
    return `${label}${gap}${actual}${slash ?? ''}`;
  });
}
