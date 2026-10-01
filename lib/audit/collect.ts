import type { AuditFacts, RawVsRendered } from '../../src/types';
import { safeFetch } from '../ssrfGuard';
import { clip, type Emit } from '../progress';
import { checkBotAccess } from './botAccess';
import { contentSignals } from './contentSignals';
import { anchorCount, invisibleSchemaItems, navigationControls, schemaEntities, schemaTypes, textOf, wordCount } from './htmlFacts';

// A normal browser identity, so the raw fetch measures what the site serves everyone, not what it
// serves a scanner.
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

interface CollectInput {
  url: string;
  origin: string;
  robotsText: string | null;
  renderedHtml: string;
  renderedStatus: number;
  hreflangCount: number;
  emit: Emit;
}

/**
 * Gathers the measured evidence the report is later checked against: what a crawler without
 * JavaScript receives, what each search/AI crawler is allowed to fetch, what the structured data
 * really contains, and which sections the page visibly has. Each probe is independent and a failure
 * in one never fails the scan.
 */
export async function collectFacts(input: CollectInput): Promise<AuditFacts> {
  const { url, origin, robotsText, renderedHtml, renderedStatus, hreflangCount, emit } = input;
  const facts: AuditFacts = {};

  const renderedText = textOf(renderedHtml, false);
  const renderedEntities = schemaEntities(renderedHtml);

  // 1. Raw HTML vs rendered DOM.
  try {
    const raw = await safeFetch(url, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' }, timeoutMs: 8000, maxBytes: 3 * 1024 * 1024 });
    const rawEntities = schemaEntities(raw.text);
    const rawTypes = schemaTypes(rawEntities);
    const renderedTypes = schemaTypes(renderedEntities);
    const nav = navigationControls(renderedHtml);
    const rvr: RawVsRendered = {
      rawStatus: raw.status,
      rawBytes: Buffer.byteLength(raw.text),
      rawWords: wordCount(textOf(raw.text, true)),
      rawLinks: anchorCount(raw.text, true),
      rawSchemaTypes: rawTypes,
      renderedWords: wordCount(renderedText),
      renderedLinks: anchorCount(renderedHtml, false),
      renderedSchemaTypes: renderedTypes,
      schemaOnlyAfterJs: renderedTypes.filter((t) => !rawTypes.includes(t)),
      navButtons: nav.buttons,
      navAnchors: nav.anchors
    };
    facts.rawVsRendered = rvr;
    emit('render', 'info', `without JavaScript the page is ${rvr.rawWords} words and ${rvr.rawLinks} links; after JavaScript runs it is ${rvr.renderedWords} words and ${rvr.renderedLinks} links`);
    if (rvr.rawWords < rvr.renderedWords * 0.4 && rvr.renderedWords >= 200 && rvr.renderedWords - rvr.rawWords > 150) {
      emit('render', 'warn', `most of the content (${rvr.renderedWords - rvr.rawWords} words) only exists after JavaScript runs; crawlers that do not run scripts will not see it`);
    }
    if (rvr.schemaOnlyAfterJs.length) emit('schema', 'warn', `schema only present after JavaScript runs: ${rvr.schemaOnlyAfterJs.join(', ')}`);
    if (rvr.navButtons > 0 && rvr.navButtons > rvr.navAnchors) emit('links', 'warn', `${rvr.navButtons} navigation control(s) are buttons, not links (${rvr.navAnchors} real anchors in header/nav/footer): crawlers cannot follow buttons`);
  } catch (err: any) {
    emit('render', 'info', `raw (no-JavaScript) comparison skipped: ${clip(err?.message, 90)}`);
  }

  // 2. Structured data: what each entity carries, and whether its content is on the page.
  const invisible = invisibleSchemaItems(renderedEntities, renderedText);
  facts.schema = { entities: renderedEntities, invisible };
  for (const inv of invisible) {
    emit('schema', 'warn', `${inv.type} markup describes ${inv.items.length} of ${inv.total} item(s) that are not visible on the page, e.g. "${clip(inv.items[0], 60)}"`);
  }

  // 3. Which sections and prices the page visibly has.
  facts.signals = contentSignals(renderedHtml, renderedText, hreflangCount);

  // 4. Crawler access by user agent, against robots.txt.
  try {
    facts.botAccess = await checkBotAccess(origin, robotsText, renderedStatus, emit);
  } catch (err: any) {
    emit('llms', 'info', `crawler access test skipped: ${clip(err?.message, 90)}`);
  }

  return facts;
}
