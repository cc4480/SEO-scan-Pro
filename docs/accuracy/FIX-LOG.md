# Fix log

Every defect found by the accuracy programme, its root cause, the fix and the test that guards it.
Newest entries at the bottom. IDs match the issue register in `PLAN.md`.

Entry template:

```
## <ID> <short title>   [status: open | fixed | wontfix]
- Seen on: <site ids>
- Symptom: what the user saw that was wrong
- Evidence: what was checked
- Root cause: file / function
- Fix: what changed
- Test: tests/unit/<file> "<test name>"
- Verified on re-run: <site ids and result> (filled in by the lead)
```

Status of the register at the start of the programme (all open):
A-01 A-02 A-03 A-04 A-05 A-06 A-07 A-08 A-09 A-10 A-11 A-13 A-14 are scanner defects; A-12 is a defect in
the ground-truth tool. Detailed entries are added below as each is fixed.

---

## A-01 Unreadable robots.txt / sitemap / llms.txt reported as "none published"   [status: fixed]
- Seen on: 02, 16, 25, 26, 29
- Symptom: "no crawl rules published, so all crawlers are allowed" and "sitemap not found" for sites that simply refused our request (Wikipedia, Reddit, The Guardian answer 403/406 to a request with no User-Agent).
- Evidence: curl with no UA gives 403/406; with "Mozilla/5.0 (compatible; SEOScanPro/1.1; +<site>)" gives 200.
- Root cause: lib/ssrfGuard.ts safeFetch sent no User-Agent; lib/crawler.ts crawlUrl treated every non-OK robots/sitemap/llms answer as absence.
- Fix: safeFetch sends a polite identifying User-Agent (APP_URL, fallback https://seoscanpro.com) when the caller passes none. crawlUrl: only 404/410 mean "none published"; 401/403/406/418/429/5xx and timeouts log "could not be read: HTTP nnn", leave robotsText null and robotsBlocksAll undefined. New CrawlResult fields robotsReadable, sitemapChecked (false when refused/failed, or 404 while robots was unreadable), llmsChecked; sitemapFound stays false in that case. Documented in src/types.ts.
- Test: tests/unit/botAccess.test.ts "default request identity (A-01)" and "crawlUrl: robots.txt that cannot be read (A-01)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-02 Crawler-access probe: baseline, IP-verified crawlers, transient failures   [status: fixed]
- Seen on: 02, 04, 21, 25, 28
- Symptom: a site that refuses every non-browser client (Canva) showed "all 13 crawlers blocked"; Googlebot/Bingbot/Applebot refusals of a spoofed request counted as blocks; one timeout counted as a block.
- Evidence: ground-truth probes; vendors verify these three crawlers by IP / reverse DNS.
- Root cause: lib/audit/botAccess.ts compared probes with the Chromium render status (a different transport) and treated any refusal or status 0 as a block.
- Fix: baseline is one extra browser-UA request through the same safeFetch; if it is refused, BotAccess.baselineRefused = true and every refused result is inconclusive (not blocked). Googlebot, Bingbot, Applebot refusals with a healthy baseline are inconclusive. A status 0 is retried once after 400 ms; a persistent 0 is reported "no response (tried twice)". blocked = refused and not inconclusive. BotAccess.unreadableRobots set when robotsText is null. Event-log wording updated. checkBotAccess keeps its signature (3rd argument is now only used in the log message), so collect.ts is untouched.
- Test: tests/unit/botAccess.test.ts "checkBotAccess (A-02)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-04 Unreachable / challenge-page scans carried fabricated findings   [status: fixed]
- Seen on: 05-nytimes, 26-stackoverflow, 29-tesla
- Symptom: with placeholder data the report still listed "3 of 14 images missing alt", prices and link counts as critical issues and fixes.
- Evidence: audit-corpus/results/*.json; finalizeReport returned early for hasSimulatedData, leaving the draft untouched.
- Root cause: lib/audit/finalize.ts early return; lib/deepseek.ts still asked the model to write findings about placeholder data.
- Fix: finalize.ts `unreadableReport()` rebuilds the report: summary says live data could not be retrieved, criticalIssues is one line, recommendedFixes are only "check whether bot protection blocks automated clients" and "re-run once readable", scoreMethod 'illustrative', no breakdown/competitor text, qa.removed lists every discarded draft item, hand-off prompt rebuilt from this. Same path when CrawlResult.pageKind === 'challenge' ("The site served a bot challenge (<reason>) so the real page could not be audited"). generateSeoReport no longer calls the model for such scans. UI: ReportDashboard challenge banner (simulated banner already existed), EvidencePanel and reportEvidence.ts text.
- Test: tests/unit/truth.test.ts "A-04 unreachable site: honest report, nothing from placeholder data"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-02 (consumption) Inconclusive and policy refusals are not defects   [status: fixed]
- Seen on: 02, 04, 21, 25, 28
- Symptom: refusals by IP-verified crawlers, or by a site that refuses every non-browser client, became critical issues and cost AEO points.
- Root cause: finalize.ts / scoring.ts treated every `blocked` result as a genuine block.
- Fix: new lib/audit/botVerdict.ts (`botVerdict`, `classifyBots`): ok | policy | inconclusive | genuine. Only genuine search/assistant blocks are critical/high and cost points; inconclusive ones produce one low-priority fix that states what can and cannot be concluded and how to confirm (Search Console, Bing Webmaster Tools, server logs); model "crawler X blocked" criticals are removed when no genuine block exists. EvidencePanel and reportEvidence.ts show "Refused, cannot confirm" distinct from "Blocked". Model payload carries refusalVerdict + siteRefusesAllNonBrowserClients.
- Test: tests/unit/truth.test.ts "A-02 consumption: inconclusive and policy refusals"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-15 Refusal that robots.txt itself asks for is policy, not an error   [status: fixed]
- Seen on: 04-bbc-news (GPTBot, ClaudeBot, CCBot, Bytespider, PerplexityBot, Perplexity-User all disallowed in robots.txt and refused)
- Symptom: critical "Perplexity-User blocked, real loss of assistant visibility", high fix "let search and assistant crawlers through", critical "policy is ambiguous".
- Root cause: a blocked result was never compared with robotsAllows.
- Fix: botVerdict returns 'policy' when blocked && robotsAllows === false: no critical, no high fix, no score deduction, only a neutral qa.added line and an explanatory sentence in the evidence panel. contradiction.ts drops "robots.txt does not explicitly allow/disallow X" when robotsAllows is false for X. Training-crawler "decide and state" fix only fires for genuine (robots-allowed) blocks.
- Test: tests/unit/truth.test.ts "A-15 refusal that robots.txt itself asks for is policy"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-01 (consumption) Unreadable robots/sitemap/llms are unknown, not missing   [status: fixed]
- Seen on: 02, 16, 25, 26, 29
- Root cause: scoring deducted "no sitemap"/"no llms.txt" and the model could claim them missing even when the request was refused.
- Fix: scoring.ts skips those deductions when CrawlResult.sitemapChecked / llmsChecked === false; contradiction.ts drops claims that the sitemap, llms.txt or robots.txt is missing / has no rules when it could not be read; the model payload says "unknown (could not be read)" with a prompt rule; EvidencePanel and reportEvidence.ts state which files could not be read and that no points were deducted.
- Test: tests/unit/truth.test.ts "A-01 consumption: unreadable robots/sitemap/llms"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-05 Navigation labels linking to another page counted as a section   [status: fixed]
- Seen on: 24-craigslist (footer link "faq" => "visible FAQ section" + critical "visible FAQ has no FAQPage markup")
- Root cause: lib/audit/contentSignals.ts linkLabels read every <a>/<button> label regardless of href.
- Fix: only <a> whose href starts with '#' count; buttons (no href) and links to other pages do not. Headings count as before; '#how' "How it works" still counts.
- Test: tests/unit/truth.test.ts "A-05 navigation labels count only when they are in-page anchors"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-06 Valid JSON followed by extra text dropped the report to the offline generator   [status: fixed]
- Seen on: 07-stripe, 20-airbnb ("Unexpected non-whitespace character after JSON at position 9207")
- Root cause: lib/deepseek.ts JSON.parse on the whole reply.
- Fix: `parseModelJson` strips fences, tries the whole text, then takes the first balanced top-level object (`firstJsonObject`, string-aware). Also: the failure fallback is now run through finalizeReport (it was returned unchecked).
- Test: tests/unit/truth.test.ts "A-06 model JSON followed by extra text"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-07 Model asserted things about text it was never shown   [status: fixed]
- Seen on: 02-wikipedia ("no concise definition block near the top")
- Fix: contentSignals computes `openingText` (first ~120 words of <main>/<article>, else body; new ContentSignals.openingText in src/types.ts) and it goes to the model as measured.openingText with a prompt rule; contradiction.ts drops "no direct answer / definition / lead summary" claims when openingText is absent from the evidence (recommendations such as "add a direct-answer block" are left alone).
- Test: tests/unit/truth.test.ts "A-07 opening text as evidence"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-08 (report side) alt="" counted as missing   [status: fixed]
- Seen on: 06, 03, 16, GitHub, Apple, Wikipedia
- Fix: scoring.ts deducts only for images.noAltAttribute (falls back to missingAlt on older scans); the model payload gives imagesMissingAltAttribute and imagesWithEmptyAltDecorativeValid with a prompt rule; contradiction.ts drops a claim that N images "have no alt attribute" when N exceeds noAltAttribute, or that alt text is missing when noAltAttribute is 0. The offline generator uses the attribute count.
- Test: tests/unit/truth.test.ts "A-08 alt text: only a missing attribute is a defect"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-13 Severity inflation   [status: fixed]
- Seen on: 01 (8 criticals on example.com), 03 (title suffix critical)
- Fix: finalize.ts calibration: criticalIssues keep only measured severe conditions (robots blocks all, noindex, HTTPS missing, genuinely blocked search/assistant crawlers, severe JS gap, no title, no H1; unreachable/challenge handled by the unreadable report). Everything else moves to recommendedFixes once (no duplicate if a fix already covers it; low for minor wording, else medium) and is recorded in new report.qa.demoted, shown in EvidencePanel/reportEvidence. tests/unit/audit.test.ts "does not demote a navigation-buttons critical issue..." was updated: that item now becomes a fix, not a critical.
- Test: tests/unit/truth.test.ts "A-13 severity calibration"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-02 (addendum, R2 N6/N7) Odd status codes, all-crawlers-refused, single 429   [status: fixed]
- Seen on: Hacker News (N6), a site that rate-limited one request (Bytespider, N7)
- Symptom: HTTP 419 for every crawler UA (browser 200) logged "all 13 received the page" yet the report called them blocked; one 429 counted as a block though later requests got 200.
- Root cause: lib/audit/botAccess.ts classified only 401/403/406/429 as refusals in the log path but the report layer saw status >= 400; no retry for 429.
- Fix: any status >= 400 or 0 is "failed"; only 401/403/406/429 and a persistent no-response can be `blocked`, other codes are `inconclusive` with an explicit log line. If every crawler look-alike failed while the browser baseline was healthy, all results are inconclusive with a clear message and the "all received the page" line is never emitted. A 429 (like a 0) is retried once, waiting Retry-After capped at 2 s.
- Not fixed here: the ungrammatical fix text lives in lib/audit/finalize.ts (F-TRUTH's file), not in my files.
- Test: tests/unit/botAccess.test.ts "N6" and "N7" cases
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-12 / N-13 / R3-02 / R5-09 Ground-truth tool defects   [status: fixed]
- Seen on: 02, 05, 12, 14, 16, 20, 27, 28, 30 and others
- Symptom: ground truth said "robots blocks all" for sites whose "Disallow: /" belongs to a named bot; read og tags only from property= (MDN uses name=); the JS-off load could return 304; measured before lazy content hydrated (Reddit, Airbnb); measured a Cloudflare challenge page as the site (W3C).
- Root cause: scripts/audit-corpus/ground.ts and measure.js (tool code, not the scanner).
- Fix: group-aware disallowsEveryone parser; og selectors accept name=; JS-off load runs with cache disabled; rendered load waits out challenge titles, scrolls to hydrate, and records challengeTitle.
- Test: none (measurement tool); verified by the re-run.
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## R3-03 robotsBlocksAll read from the "*" group only   [status: fixed]
- Seen on: LinkedIn
- Symptom: "robots.txt disallows every crawler" (40-point penalty) although ~60 named groups give Googlebot, Bingbot, Applebot, OAI-SearchBot, Claude-SearchBot partial access.
- Root cause: lib/crawler.ts robotsBlocksAll scanned only the "*" group.
- Fix: lib/audit/robotsRules.ts gains robotsAccess (per crawler, most specific group wins: 'allowed' | 'partial' | 'disallowed') and robotsBlocksEveryone ("*" disallows "/" AND no named group grants access); crawler.ts robotsBlocksAll delegates to it and CrawlResult.robotsByCrawler (keyed by BOTS names) is set when robots.txt is read.
- Test: tests/unit/botAccess.test.ts "robots.txt verdicts per crawler (R3-03)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-14 Attribute parser stopped at an apostrophe inside a double-quoted value   [status: fixed]
- Seen on: 03 GitHub ("Join the world's most..." became "Join the world"), 13 NASA, 18 Nike ("Inspiring the world")
- Root cause: every attribute regex in `parsePage` used `["'][^"']*["']`, so a value ended at the first quote of EITHER kind; tag bodies were matched with `[^>]*`, which also ends a tag at a `>` inside a value.
- Fix: `lib/audit/htmlFacts.ts` gains a tag/attribute tokenizer (`findTags`, `parseAttrs`): quote-aware tag bodies, double/single/unquoted values, any attribute order, first duplicate wins, entities decoded (`&amp;` in URLs and `&lt;br&gt;` in alt text no longer reach the report raw). `parsePage` reads meta, `<html lang>`, canonical (rel token list), hreflang, img src/alt, a href/text through it. Also: scripts, styles, `<template>` and comments are removed before parsing (markup quoted inside inline JSON no longer counts as links/images/headings), protocol-relative and bare-relative links (`//cdn.x/a`, `item?id=1`, `?p=2`) resolve through `new URL` and `www.` is ignored when classifying internal links (N5, Hacker News).
- N2 (GOV.UK): a `<meta>` carrying both `name` and `property` (`name="title" property="og:title"`) now sets both keys; before only `name` was read and og:title/og:description were reported missing.
- Test: tests/unit/measure.test.ts "attribute tokenizer (A-14)", "N2", "N5", "A-14 (Nike)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-09 Visible word count included hidden text   [status: fixed]
- Seen on: 06, 08, 13, 14, 22 and 7 more (Apple 1510 by markup vs 740-893 innerText; NASA/Shopify/GOV.UK hundreds of display:none words)
- Root cause: `parsePage` counted words in the markup after stripping tags; menus, `display:none`, collapsed panels and visually hidden text are in the markup but not on screen.
- Fix: `renderPage` captures `document.body.innerText` (`RenderedPage.visibleText`); `parsePage(..., visibleText)` uses it for `wordCount`, and `collectFacts` uses it (`renderedText`) as the rendered side of rawVsRendered and for the section/schema-visibility checks. The markup count is only the fallback (plain HTML): it drops `<head>`, elements with the `hidden` attribute and inline display:none / visibility:hidden. aria-hidden is deliberately NOT excluded: innerText includes it.
- Measured live afterwards (scanner words vs same-session innerText): Apple 740/740, GOV.UK 582/582, GitHub 869/869, Python 605/605, Nike 414/414, Vercel 64/64, LinkedIn 418/418. The old markup count for the same pages: 1510, 583, 1078, 1064, 2050, 521, 726.
- Test: tests/unit/measure.test.ts "visible word count (A-09)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-10 Raw (no-JavaScript) words and links disagreed with a JavaScript-off load   [status: fixed, with a caveat]
- Seen on: 08, 12, 13, 17, 18, 20, 23, 24 (plus N-08 on MDN)
- Root cause: raw words/links were a regex count over a plain HTTP response. (1) It cannot know what the STYLESHEET hides (GitHub 1020 vs 811 words with JS off, Python 1051 vs 616, Vercel 512 vs 64, Nike 1221 vs 318, LinkedIn 726 vs 418). (2) It counted `<template>`, script-quoted and commented anchors (N-08: MDN 169 vs 158). (3) A bot wall served to the plain client was reported as "the page has 0 words without JavaScript".
- Fix: `lib/audit/noJs.ts` `measureWithoutJs` loads the page in the real browser with JavaScript DISABLED (1366x900, every request through the SSRF guard, same client identity as the rendered load) and reads innerText and `a[href]`; `collectFacts` uses it for `rawWords` / `rawLinks` (`RawVsRendered.rawMeasuredBy = 'browser-no-js'`), falling back to the corrected regex count (`'http-fetch'`). `anchorCount` ignores `<template>`, scripts and comments (N-08). Measured live: browser no-JS words equal the independent JS-off innerText (Python 616, Vercel 64, GitHub 811).
- Caveat: Amazon and Airbnb serve different pages to different requests, so they can differ run to run. That is the site varying, not the counter.
- Test: tests/unit/measure.test.ts "anchorCount ignores anchors inside <template> (N-08)", "raw-side text excludes head text and hidden blocks"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## N3 / R5-03 / R4-03 The raw response was an interstitial, cut off, or far smaller than the page, and was compared anyway   [status: fixed]
- Seen on: 12 Amazon (2 KB meta-refresh `bm-verify` page, 202), 30 W3C and 28 Canva (403 challenge), 23 Python (21 KB recorded of 53 KB)
- Fix: `classifyRawResponse` (challenge.ts) flags a challenge title/wording, a bare meta-refresh to a verification URL, an HTTP 202 with <= 10 words, and any status >= 400. `collectFacts` then sets `RawVsRendered.rawFetchUnreliable` (reason), leaves `schemaOnlyAfterJs` empty, suppresses the "most content only after JavaScript" warning when the figures came from the wall, and sets `rawChallenge` when the no-JS load itself was a wall (also on HTTP >= 400). A body that ended early or is under 25% of the rendered HTML (when that is over 30 KB) is fetched once more and the fuller answer kept; `SafeResponse.truncated` (set in `lib/ssrfGuard.ts requestOnce` when the connection ended before `res.complete`, minimal edit in F-ACCESS's file) feeds this. F-TRUTH: when `rawChallenge` or `rawFetchUnreliable` is set, do not state raw word/link/schema figures as facts.
- Test: tests/unit/measure.test.ts "N3: a raw response that is only a refresh..." and the A-03 suite
- Verified on re-run: run 2. Live check: Amazon raw = real no-JS load (635 words, 120 links) with `rawFetchUnreliable` set for the plain fetch; W3C raw 532/95 (was a false "challenge" until the no-JS load used the same identity as the render).

## A-08 (parser side) alt="" counted as missing; lazy images   [status: fixed]
- Seen on: 06, 03, 16, 17, 20
- Fix: `images.noAltAttribute` (no alt attribute: a defect), `images.emptyAlt` (alt="" or whitespace: valid decorative), `images.missingAlt` = `noAltAttribute` only. Images are counted by their real source: `src` absent or a `data:` placeholder with `data-src` / `data-lazy-src` / `srcset` / `data-srcset` is an image (`images.lazyNoSrc`, included in `total`). `describePage` logs the three numbers. The existing test "counts images and flags missing alt text" expected the old combined count (2); updated to missingAlt 1 + noAltAttribute 1 + emptyAlt 1.
- Test: tests/unit/measure.test.ts "alt text split and lazy images (A-08, A-11)"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## A-03 Bot challenge / interstitial audited as the site   [status: fixed (flag; F-TRUTH writes the report)]
- Seen on: 28 Canva ("Unsupported client - Canva", H1 "Please update your browser", noindex,nofollow); 30 W3C ground run ("Just a moment...")
- Fix: `lib/audit/challenge.ts` `classifyChallenge({status,title,h1,bodyText,robots})` returns a reason or null: a title that starts with a wall phrase; wall wording in the heading/body only on pages of <= 150 words; 403/429/503 + noindex + <= 60 words. `crawlUrl` sets `CrawlResult.pageKind` ('normal' | 'challenge') and `challengeReason` (also for non-OK responses, before the placeholder fallback) and logs a warn event. F-TRUTH: never give "server-render your content" advice when pageKind is 'challenge' (R3-07).
- False-positive guard: tests run the 28 distinct real corpus titles, thin pages, and phrase-heavy long articles ("How to fix Access Denied errors"): none flagged.
- Test: tests/unit/measure.test.ts "bot challenge classifier (A-03)"
- Verified on re-run: run 2. Live: Canva still flagged (its wall persists for both identities), python/vercel/github/w3c not.

## R5-02 / R5-06 First response refused or challenged although another identity gets the page   [status: fixed]
- Fix: `renderPage` takes a user agent; `crawlUrl` classifies the first answer and, on a challenge or HTTP 401/403/406/429/503, retries ONCE with a second honest browser identity (Chrome token + `SEO-Scan-Pro/1.1`, never a search crawler) and keeps whichever got the real page. A self-clearing JavaScript check ("Just a moment...", "Checking your browser") is waited out for up to 10 s inside `renderPage`, and the status of the page it cleared into replaces the challenge's. Bounded: one retry, one 10 s wait per load.
- Test: no unit test (needs a live browser and a hostile site); verified live on Canva, W3C.

## N1 / R5-01 / R4-04 Link probe: undecoded `&amp;`, bot-wall statuses and HEAD-only 404 reported as broken   [status: fixed]
- Fix: `checkLinks` decodes entities in hrefs (older stored lists), uses `isBrokenStatus` (404, 410 and 5xx except 503 only; 401/403/429/503/999 are "could not be verified", not broken and not counted as checked), and confirms any failure with one GET before reporting it (HEAD 404 was trusted).
- Test: tests/unit/measure.test.ts "N1 / R4-04"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## R3-01 / R3-05 / R3-08 Viewport, hreflang cap, page weight   [status: fixed]
- R3-01: `renderPage` (and the JS-off load) set a 1366x900 viewport before navigation; the Puppeteer default 800x600 triggers tablet layouts and different lazy loading (Nike CLS 0.185 vs 0.054, 8 vs 13 H2).
- R3-05: `CrawlPageData.hreflangTotal` keeps the true count; `hreflang` stays a 50-entry sample. Test "R3-05".
- R3-08: `pageSizeKb` is the serialized DOM, not transfer. `CrawlPageData.transferKb` (all resources, compressed, from CDP `Network.loadingFinished`) and `requestCount` are now recorded. F-TRUTH: relabel `pageSizeKb` as "HTML size" and use `transferKb` for "page weight" (Nike HTML 1585 KB vs transfer 40 MB in one run, Amazon 2351 KB HTML vs 5126 KB transferred).
- R4-01: `CrawlResult.redirectHops` = redirectChain.length - 1; consumers must use it, not the chain length.

## A-11 Other count mismatches   [status: investigated; scanner bug fixed, the rest was the site varying]
- Scanner bugs fixed: regex-counted markup inside inline scripts, `<template>` and comments (Craigslist 451 links); `[^>]*` tag bodies cut at `>` in attribute values; entity-encoded URLs and alt text; slash-less relative hrefs classified external.
- Same-session comparison scanner vs live DOM: H2 equal on every site (Amazon 12/12, Nike 8/8 at the old viewport), H1 equal (Craigslist 1/1, Amazon 0/0), images equal except imgs with NO source attribute (Nike 88 of 127, LinkedIn 1 of 7: `<img data-delayed-url=...>` / `data-landscape-url` with no src, never loaded; not counted, deliberately), links equal after excluding '#', javascript:, mailto:.
- The site varying between the scan run and the ground run (NOT scanner errors): Amazon H2 12 vs 22 and images 75 vs 106; Nike H2 8 vs 13 (partly the 800x600 viewport, R3-01); Reddit images 125 vs 26 and links 199 vs 95 (infinite feed; a fresh same-session load: 146 scanner = 146 DOM images, 22 lazy); Craigslist H1 and links 451 vs 258 (geo-routed city site, different city per client); W3C (ground got the challenge "Just a moment...") and Canva (scanner got the "Unsupported client" wall).
- Test: tests/unit/measure.test.ts "ignores markup quoted inside scripts, templates and comments", "classifies protocol-relative and relative links correctly"
- Verified on re-run: run 2 (2026-09-30-run2, 30 sites): defect no longer reproduces; see runs/2026-09-30-run2/SUMMARY.md

## F-TRUTH second batch (reviewer-found report-side defects)   [status: fixed unless noted]
All tests are in tests/unit/truth.test.ts (describe names in brackets). Verified on re-run: run 2.

- **N-01 offline fallback unchecked** (07): lib/deepseek.ts catch branch now runs the fallback through finalizeReport (measured scores, fact-check, qa). [N-01 / N-02 / N-03 / R3-09 offline fallback]
- **N-02, N-03, R3-09 offline generator invented claims** (07, 20): generateSimulatorReport no longer writes "Excellent" answer friendliness, voiceSearchOptimized constants, competitor text, the "2026 search speed standards" line, the "Strengthen Answer optimization" filler fix, schema/alt boilerplate, or a hard-coded 600 ms "slow" critical. Speed is a fix only from TTFB > 800 ms or LCP > 2500 ms, never critical; the executive summary states it is the rule-based fallback. Sitemap advice only when the sitemap was really checked, priority low.
- **N-04, N-R5-04, N-R5-05 full scope of A-04** (05, 26, 28, 29): unreadable/challenge reports are built locally with no model call, one honest critical line, only "check bot protection" and "re-run" fixes, no placeholder strings, no HTTP status for an interstitial (the interstitial is named by challengeReason). robots.txt facts that were really read (CrawlResult.robotsByCrawler 'disallowed') are kept in the summary; no llms.txt advice anywhere in it. N-05 (brand "Www", "//about") is moot because no placeholder value reaches the report (the placeholder generator itself in crawler.ts is F-MEASURE's). [N-04 / R5 simulated and challenge reports]
- **N-06 / R4-02 sections from nav labels, headlines, donation banners** (08, 25): contentSignals only counts headings of at most 8 words as sections, reviews need a heading that is (almost) only "reviews/testimonials" or a rating, faq needs "faq / frequently asked / common questions" (bare "questions" removed), pricing needs a plan/price context and ignores donation/support asks. [N-06 / R4-02]
- **N-07 hreflang suggestion removed with a false reason** (10): contentSignals finds language-switcher links (/de/, /pt-BR/; three or more) and sets multiLanguage + localeLinks; the hreflang suggestion is kept, "single-language" claims are dropped, and finalize adds a measured "declare hreflang" fix. [N-07 / N-10]
- **N-10 Content-Signal ignored** (08): contentSignals(…, robotsText) parses `Content-Signal` (collect.ts passes robotsText: one-argument edit in an F-MEASURE file); the model is told; claims praising training access are dropped when ai-train=no. [N-07 / N-10]
- **N-14 sitemap deduction invisible** (09): finalize adds a low-priority "Publish an XML sitemap" fix whenever the score deducts for it (never when the sitemap could not be read). [N-14]
- **N4 / R3 / A-15 allow advice and "robots.txt allows them"** (12, 04, 25): contradiction drops advice to allow a crawler robots.txt explicitly disallows (robotsAllows false or robotsByCrawler 'disallowed') and any "robots.txt allows X" for it; with an unreadable robots.txt nothing is said about what it allows or disallows. The fix text only says "robots.txt allows them" when robotsAllows is true. Crawler-fix wording rewritten (singular/plural, names only genuinely blocked crawlers). [N4 / R3 robots.txt disallows are policy]
- **N8 invented image identities** (14): payload now carries imageSamples (file, alt) and a prompt rule forbids naming other images. Prompt-side only. [none: prompt rule]
- **N9 Organization subtypes** (11): Corporation, LocalBusiness, NGO, OnlineStore etc. count as Organization. [R2 / R3 / R4 checker rules: N9]
- **N10 customer stories** (11): new ContentSignals.customerStories; "add testimonials/case studies" dropped when present. [N10]
- **N11 / R3-04 navigation buttons** (14, LinkedIn, IKEA): scoring.navButtonsMatter: only when the navigation has no anchors, fewer than 10 rendered links, or raw links well below rendered; scoring, the measured fix and the model's claim all use it. [N11 / R3-04]
- **N12 retired Google features** (11, 14, 15): sitelinks search box and "eligible for FAQ/HowTo rich results" dropped; FAQPage and SearchAction fixes capped at low; prompt deny-list. [N12]
- **N13 llms.txt overclaims** (12, 13): llms.txt fixes capped at low with an "optional, not confirmed to be read" note; criticals about it are demoted by A-13. [N13]
- **R4-05 wrong removal reason and paired critical** (23, 24): "about"/"contact" match only as "about section/page"; never when the text is about llms.txt, sitemap, schema, etc.; a critical overlapping a removed fix is removed too. [R4-05]
- **R4-06 report-only CSP** (23): securityHeaders.cspReportOnly recorded (one-line edit in crawler.ts securityHeadersFrom), scored as 1 point "report-only", and "CSP missing" advice dropped. [R4-06]
- **R4-07 geo redirect / hop wording / N-R5-08 redirect** (24, 27): hop-count claims must match crawl.redirectHops (or chain length - 1); redirects through geo/locale URLs are dropped; redirect fixes capped at medium. [R4-07]
- **R4-08 FAQPage / BreadcrumbList** (22): FAQPage advice dropped without visible Q&A (no faq section, no heading ending in "?"); breadcrumb advice about the home page dropped. [R4-08]
- **R4-09 absent images / short page critical** (24): covered by the A-13 calibration (not a severe condition); regression test added. [R4-09]
- **R3-06 HTTP 999** (23, LinkedIn): scoring.verifiedBroken excludes 401/403/429/999 from the broken-link count, payload and offline fix; "broken ... 999" claims dropped. [R3-06]
- **N-R5-07 identifiers in text** (26-30): finalize.plainEnglish rewrites payload field names in every user-facing string; prompt forbids quoting them. [R5-07]
- **N-R5-08 padding "not a defect"** (27): fixes whose own text says "not a defect / no action needed / nothing to fix" are dropped. [R5-08]
- **F-MEASURE fields**: rawChallenge / rawFetchUnreliable suppress the JavaScript-gap findings, score penalties, nav-button findings and raw-figure claims; redirectHops replaces chain length; page weight uses transferKb ("page transfers N KB") else labelled "HTML document is N KB"; payload sends htmlSizeKb, totalTransferKb, requestCount, hreflangCount (hreflangTotal). [F-MEASURE fields consumed]
- Not done / notes: N8 has no deterministic checker (prompt only); R4-01 (hop wording from chain length) is covered only for claims of the form "N-hop"; N-R5-05 scores in unreadable reports are still the draft's placeholder numbers, labelled 'illustrative' by the banner (Scan type needs numbers).

## R6-01 Heavy site whose load event never fires was reported unreadable   [status: fixed]
- Seen on: 18 (run 2 only; run 1 succeeded)
- Symptom: Nike returned "could not be read" because Chromium's network-idle wait timed out at 15 s although the main document answered 200 and DOMContentLoaded had fired.
- Root cause: lib/crawler.ts renderPage only trusted the `load` event for the "analyse the DOM as it stands" fallback.
- Fix: DOMContentLoaded also marks the page as loaded.
- Test: none (needs a slow live site); verified live on 18-nike.
- Verified on re-run: see run-2 summary.

## R7-01 Summary quotes scores that differ from the headline score   [status: fixed]
- Seen on: 31-secscan-info (user report: header 98/100, summary "overall 88, technical 92, content 86")
- Root cause: the model writes the summary before scores are computed; nothing reconciled them.
- Fix: lib/audit/summaryScores.ts rewrites any quoted overall/technical/content/AEO/performance score to the computed one (measurements such as "883 words" or "719 ms" are left alone); called in finalize after computeScores.
- Test: tests/unit/summaryScores.test.ts "summary scores match the computed scores"

## R7-02 "Confirmation" fixes presented as recommendations   [status: fixed]
- Seen on: 31-secscan-info (fix 8 "check sitemap and llms.txt content types ... no change is required")
- Fix: contradiction.ts drops a fix whose own text says no change/action is needed, is already correct, or only asks to confirm; the model prompt forbids "keep X aligned / consider keeping tidy / confirm" items.
- Test: tests/unit/summaryScores.test.ts "fixes that confirm something is fine are not findings"

## R7-03 "Deliberate policy / owner's decision" asserted without evidence   [status: fixed]
- Seen on: 31-secscan-info (AI crawlers disallowed by a Cloudflare default the owner did not choose)
- Fix: the prompt now says robots.txt states the rule, never that the owner chose it, and adds one clause that CDN or host defaults can add such rules and can be removed.
- Test: prompt wording only (model-side); the deterministic parts are covered by existing policy tests.

## R7-04 Claims of a missing definition / relationship / FAQ mirror   [status: partly fixed]
- Seen on: user report for secscan.info (fixes 1, 4, 7)
- Status: not reproduced on today's scan (opening text and FAQ checks from the A-07 and A-05 fixes held; 0 criticals); the prompt now requires checking openingText and headings first. No new deterministic check was added because the model-side claim varies run to run.

## R8-01 Fact-check removed valid advice (over-removal)   [status: fixed]
- Seen on: code review of lib/audit/contradiction.ts, reproduced with 8 hand-written valid fixes (5 were dropped)
- Symptom: "Rewrite the H1 / add your keyword to the H1", "title and H1 do not match", "set viewport to include initial-scale=1", "add canonical tags to blog templates" were removed as "the page already has X"; "Add Y. No changes are required to Z" was removed as "nothing to fix".
- Root cause: the presence rules (h1, viewport, canonical, meta description) matched an ask verb up to 40 characters before the term, so any sentence that mentions the element after "add"/"no"/"set" counted as a request for it to exist. The "nothing to fix" rule matched anywhere in title + description + remediation.
- Fix: presence rules now need the term directly after the verb (`asksToCreate`), and are skipped when the text is about changing the element (`MODIFIES`: keyword, mismatch, initial-scale, points to, ...) or about other pages/templates (`ELSEWHERE`). The "nothing to fix" rule drops a fix only when, with the no-action phrase removed, no action verb is left.
- Test: tests/unit/truth.test.ts "fact-check keeps valid advice (over-removal guard)" (both directions: valid advice kept, real "already present" and pure confirmations still removed)

## R8-02 Policy-only crawler refusal deleted the model's crawler advice with a false reason   [status: fixed]
- Seen on: code review of lib/audit/finalize.ts, reproduced
- Symptom: when the only refusal was policy (robots.txt disallows the crawler), a valid fix such as "add explicit user-agent rules for OAI-SearchBot" was removed as "replaced by a measured finding on the same topic" although no measured finding was written.
- Root cause: `botsMeasured` was true whenever any result had `blocked`, including policy and inconclusive ones.
- Fix: `botsMeasured` is true only when a measured crawler finding was actually added (confirm / let through / decide). Separately, and explicitly, a model fix that names a policy-refused crawler and advises letting it through is removed with the accurate reason (the refusal matches robots.txt's own Disallow rules).
- Test: tests/unit/truth.test.ts "crawler advice is only replaced by a finding that exists"; existing A-15 test still passes.

## R8-03 Review tool compared the wrong alt-text numbers   [status: fixed]
- Seen on: 14 of 30 sites in run 2 ("images missing/empty alt" MISMATCH, e.g. react.dev scanner 0 vs truth 24)
- Root cause: scripts/audit-corpus/review.ts compared the scanner's `missingAlt` (images with NO alt attribute, by design: alt="" is valid) with ground truth `noAlt + emptyAlt`. A tool defect, not a scanner one; it inflated the mismatch count in runs/2026-09-30-run2/SUMMARY.md.
- Fix: the sheet now compares "images with no alt attribute" and "images with alt=\"\" (decorative)" each with its own ground-truth number.
- Test: none (measurement tool). The run-2 sheets and SUMMARY.md were generated with the old comparison and are NOT regenerated here; the next corpus run will give the corrected count.

## R8-04 `npm test` failed on a fresh checkout, and nothing ran the tests   [status: fixed]
- Fix: tests/setup.ts falls back to a throwaway JWT_SECRET when .env.test is absent, so unit tests need no setup. `.env.test.example` documents the DATABASE_URL integration tests need. `npm run test:unit` added. `.github/workflows/ci.yml` runs typecheck + unit tests, and integration tests against a PostgreSQL service. The workflow has not been run yet (it only exists on this branch).

## R8-05 Same finding listed twice after a critical was demoted   [status: fixed]
- Seen on: local smoke scan (offline generator): "Repair Alt Attributes for Images" + "Found 1 images missing alt-text descriptions"; "Create and reference Sitemap.xml" + "No sitemap was found"
- Root cause: finalize.ts only added a demoted critical as a fix when no existing fix shared 60% of its significant words (and at least three); short items never matched.
- Fix: `sameTopic` (alt text, sitemap, security headers, broken links, Open Graph, canonical, meta description, llms.txt, hreflang, structured data). A demoted critical is added as a fix only when no existing fix overlaps by words OR covers the same topic. The demotion is still recorded in qa.demoted.
- Test: tests/unit/truth.test.ts "demoted criticals do not duplicate a fix that covers the same topic"
