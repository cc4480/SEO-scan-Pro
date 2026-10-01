import type { AuditFacts, RawVsRendered } from '../../src/types';
import { safeFetch } from '../ssrfGuard';
import { clip, type Emit } from '../progress';
import { checkBotAccess } from './botAccess';
import { classifyChallenge, classifyRawResponse } from './challenge';
import { measureWithoutJs } from './noJs';
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
  /** The browser's own innerText of the rendered page. Preferred over reading words out of the markup. */
  renderedText?: string;
  renderedStatus: number;
  /** The client identity that received the real page. The raw and JavaScript-off loads use the same one, so the comparison is like for like (W3C challenges other identities). */
  userAgent?: string;
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

  // The browser's innerText is what a visitor reads; the markup text (which still contains hidden
  // menus and aria-hidden duplicates) is only the fallback when the browser could not supply it.
  const renderedText = input.renderedText !== undefined ? input.renderedText : textOf(renderedHtml, false);
  const renderedEntities = schemaEntities(renderedHtml);

  // 1. Raw HTML vs rendered DOM.
  try {
    // The plain response gives status, size and the schema in the markup. The no-JavaScript WORD and
    // LINK counts come from a real JavaScript-disabled browser load when possible: only a browser
    // knows what the stylesheet hides, so a regex count over the response overcounts hidden menus.
    const fetchRaw = () => safeFetch(url, { headers: { 'User-Agent': input.userAgent || BROWSER_UA, Accept: 'text/html' }, timeoutMs: 8000, maxBytes: 3 * 1024 * 1024 });
    let [raw, noJs] = await Promise.all([
      fetchRaw(),
      measureWithoutJs(url, undefined, input.userAgent).catch((err: any) => {
        emit('render', 'info', `JavaScript-off browser load skipped, counting the plain response instead: ${clip(err?.message, 80)}`);
        return null;
      })
    ]);
    // A response cut off mid-body, or far smaller than the page the browser got, is not "the page
    // without JavaScript" (python.org: 21 KB recorded, 53 KB real; the schema and links were in the rest).
    // Ask once more and keep the fuller answer.
    const looksShort = (r: { text: string; truncated?: boolean }) =>
      !!r.truncated || (renderedHtml.length > 30000 && Buffer.byteLength(r.text) < renderedHtml.length * 0.25);
    if (looksShort(raw) && !classifyRawResponse(raw.text, raw.status)) {
      const again = await fetchRaw().catch(() => null);
      if (again && Buffer.byteLength(again.text) > Buffer.byteLength(raw.text)) raw = again;
    }
    const fetchWall = classifyRawResponse(raw.text, raw.status);
    const fetchShort = !fetchWall && looksShort(raw) ? (raw.truncated ? 'the response ended before the whole page arrived' : `the response is ${Math.round(Buffer.byteLength(raw.text) / 1024)} KB against ${Math.round(renderedHtml.length / 1024)} KB for the rendered page`) : null;
    const rawFetchUnreliable = fetchWall ?? fetchShort;
    const rawWordsFetched = wordCount(textOf(raw.text, true));
    // The wall that matters is the one that produced the word and link counts: the browser's
    // JavaScript-off load when it ran, else the plain response.
    const rawChallenge = noJs
      ? classifyChallenge({ status: noJs.status, title: noJs.title, h1: noJs.h1, bodyText: noJs.text }) ??
        (noJs.status >= 400 ? `HTTP ${noJs.status}: the JavaScript-off request was refused or failed` : null)
      : fetchWall;
    const rawEntities = schemaEntities(raw.text);
    const rawTypes = schemaTypes(rawEntities);
    const renderedTypes = schemaTypes(renderedEntities);
    const nav = navigationControls(renderedHtml);
    const rvr: RawVsRendered = {
      rawStatus: raw.status,
      rawBytes: Buffer.byteLength(raw.text),
      rawWords: noJs ? wordCount(noJs.text) : rawWordsFetched,
      rawLinks: noJs ? noJs.links : anchorCount(raw.text, true),
      rawMeasuredBy: noJs ? 'browser-no-js' : 'http-fetch',
      ...(rawChallenge && { rawChallenge }),
      ...(rawFetchUnreliable && { rawFetchUnreliable }),
      rawSchemaTypes: rawTypes,
      renderedWords: wordCount(renderedText),
      renderedLinks: anchorCount(renderedHtml, false),
      renderedSchemaTypes: renderedTypes,
      // Schema in an interstitial or a cut-off response says nothing about the real page: no comparison.
      schemaOnlyAfterJs: rawFetchUnreliable ? [] : renderedTypes.filter((t) => !rawTypes.includes(t)),
      navButtons: nav.buttons,
      navAnchors: nav.anchors
    };
    facts.rawVsRendered = rvr;
    emit('render', 'info', `without JavaScript the page is ${rvr.rawWords} words and ${rvr.rawLinks} links; after JavaScript runs it is ${rvr.renderedWords} words and ${rvr.renderedLinks} links`);
    if (rawChallenge) {
      emit('render', 'warn', `the no-JavaScript request was answered with a bot challenge or blocked page (${rawChallenge}), so its word and link counts are not the site's`);
    } else if (!(rawFetchUnreliable && !noJs) && rvr.rawWords < rvr.renderedWords * 0.4 && rvr.renderedWords >= 200 && rvr.renderedWords - rvr.rawWords > 150) {
      emit('render', 'warn', `most of the content (${rvr.renderedWords - rvr.rawWords} words) only exists after JavaScript runs; crawlers that do not run scripts will not see it`);
    }
    if (rawFetchUnreliable && !rawChallenge) emit('render', 'warn', `the plain HTTP response could not be trusted (${rawFetchUnreliable}): the raw-versus-rendered schema comparison was skipped`);
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
  facts.signals = contentSignals(renderedHtml, renderedText, hreflangCount, robotsText);

  // 4. Crawler access by user agent, against robots.txt.
  try {
    facts.botAccess = await checkBotAccess(origin, robotsText, renderedStatus, emit);
  } catch (err: any) {
    emit('llms', 'info', `crawler access test skipped: ${clip(err?.message, 90)}`);
  }

  return facts;
}
