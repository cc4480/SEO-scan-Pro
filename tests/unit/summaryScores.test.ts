import { describe, it, expect } from 'vitest';
import { reconcileScoreMentions } from '../../lib/audit/summaryScores';
import { contradiction } from '../../lib/audit/contradiction';

const score = { overall: 98, technical: 100, content: 97, aeoGeo: 95, performance: 90 };

describe('summary scores match the computed scores', () => {
  it('rewrites a quoted score that disagrees (overall 88 vs 98)', () => {
    expect(reconcileScoreMentions('Scores: overall 88, technical 92, content 86.', score)).toBe('Scores: overall 98, technical 100, content 97.');
  });
  it('keeps scores that already match', () => {
    expect(reconcileScoreMentions('overall score of 98/100', score)).toBe('overall score of 98/100');
  });
  it('leaves measurements alone', () => {
    const t = 'The page has content 883 words, a load of performance 719 ms and 49 links.';
    expect(reconcileScoreMentions(t, score)).toBe(t);
  });
  it('does not turn small counts into scores', () => {
    const t = 'The content 3 sections are clear.';
    expect(reconcileScoreMentions(t, score)).toBe(t);
  });
});

describe('fixes that confirm something is fine are not findings', () => {
  const crawl: any = { mainPage: { meta: {}, headings: { h1: [], h2: [], h3: [] }, links: { list: [] }, images: [] }, redirectChain: [] };
  it('drops "no change is required"', () => {
    const text = 'check sitemap and llms.txt content types. both are served with the right type. no change is required.';
    expect(contradiction(text, crawl)).toMatch(/nothing to fix/);
  });
  it('keeps a real recommendation', () => {
    expect(contradiction('add a visible last updated date and datemodified to the webpage markup', crawl)).toBeNull();
  });
  it('drops an FAQ-answers-in-HTML fix when the FAQ is visible, marked up and already in the raw HTML', () => {
    const c: any = { mainPage: { meta: {}, headings: { h1: [], h2: [], h3: [] }, links: { list: [] }, images: [] }, redirectChain: [],
      facts: { signals: { sections: { faq: true } }, schema: { entities: [{ type: 'FAQPage' }] }, rawVsRendered: { rawWords: 880, renderedWords: 883 } } };
    expect(contradiction('add question-and-answer pairs in plain html near the faq. ensure the answer sits directly beneath the question', c)).toMatch(/already in the raw HTML/);
    c.facts.rawVsRendered.rawWords = 100;
    expect(contradiction('add question-and-answer pairs in plain html near the faq. ensure the answer sits directly beneath the question', c)).toBeNull();
  });
});

import { contentSignals } from '../../lib/audit/contentSignals';
describe('how-it-works section signal', () => {
  it('recognises "How a scan works" as a how-it-works heading', () => {
    expect(contentSignals('<h3>How a scan works</h3>', '', 0).sections.howItWorks).toBe(true);
    expect(contentSignals('<h3>Our pricing</h3>', '', 0).sections.howItWorks).toBe(false);
  });
});
