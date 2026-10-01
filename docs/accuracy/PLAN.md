# Accuracy programme: plan

Goal: every finding SEO Scan Pro shows is true. Method: run the real pipeline on 30 well-known sites,
measure each site independently, read every finding against that evidence, fix every defect at its
root, add a regression test per fix, and record each one in `FIX-LOG.md`.

Corpus: `audit-corpus/urls.json` (30 sites). First run: 2026-09-30. Sheets: `runs/2026-09-30/<id>.md`.

## Pipeline

```
scripts/audit-corpus/run.ts     real crawlUrl + generateSeoReport  -> audit-corpus/results/<id>.json
scripts/audit-corpus/ground.ts  independent measurement            -> audit-corpus/ground/<id>.json
scripts/audit-corpus/review.ts  compare + claim flags              -> docs/accuracy/runs/<date>/<id>.md
```

## Issue register (found so far; see FIX-LOG.md for status)

| ID | Defect | Seen on |
|---|---|---|
| A-01 | robots.txt / sitemap / llms.txt that cannot be READ (403, 406, 418) reported as "no rules / not found"; plain requests carry no identifying User-Agent | 02, 16, 25, 26, 29 |
| A-02 | Crawler-access test: baseline from a different transport than the probes (site that refuses all non-browser clients shows "all 13 blocked"); one transient failure counted as blocked; IP-verified crawlers (Googlebot, Bingbot, Applebot) refuse spoofed requests on purpose | 02, 04, 21, 25, 28 |
| A-03 | A bot-challenge / interstitial page ("Unsupported client", "Just a moment") is audited as if it were the site | 28 |
| A-04 | Unreachable sites (simulated data) still carry fabricated findings ("3 of 14 images missing alt") | 05, 26, 29 |
| A-05 | Section signals read from navigation labels that link to ANOTHER page ("FAQ" footer link => "visible FAQ section") | 24 |
| A-06 | DeepSeek returns valid JSON followed by extra text; parse fails and the report silently becomes the offline one | 07, 20 |
| A-07 | The model asserts things about page text it was never shown (no direct answer, no definition) | 02 |
| A-08 | Alt text: `alt=""` (valid decorative) counted as missing; wording says "no alt attribute"; scored as a defect | 06, 03, 16 |
| A-09 | Visible word count overcounts hidden text (menus, aria-hidden) vs what a reader sees | 06, 08, 13, 14, 22 (12 sites) |
| A-10 | Raw (no-JavaScript) words/links disagree with a real JavaScript-off load | 7 sites |
| A-11 | Other count mismatches: H2, links, images with src (lazy `data-src`), H1 | 12, 16, 18, 24, 30 |
| A-12 | Ground-truth tool defects (my tool): robots "disallow all" regex false positives; bot baseline logic | 8 sites |
| A-13 | Severity inflation: minor items marked "critical" | 01, 03 |
| A-14 | Attribute parser stops at an apostrophe inside a double-quoted value (meta description "world's" => "world") | 03, 13, 18 |

## Work packages and owners

Phase 1, review (read-only, parallel). Each reviewer reads every finding of its sites against the
ground truth, verifies doubtful claims live, writes a verdict into each sheet and appends new
defects to `issues/<batch>.md`. Reviewers do not edit code.

| Batch | Sites |
|---|---|
| R1 | 05, 07, 08, 09, 10 |
| R2 | 11, 12, 13, 14, 15 |
| R3 | 16, 17, 18, 19, 20 |
| R4 | 21, 22, 23, 24, 25 |
| R5 | 26, 27, 28, 29, 30 |

Sites 01, 02, 03, 04, 06 were reviewed by the lead.

Phase 2, fixes (parallel, disjoint files). Every fix gets a regression test and a `FIX-LOG.md` entry.

| Fixer | Issues | Files owned |
|---|---|---|
| F-ACCESS | A-01, A-02 (probe side) | `lib/ssrfGuard.ts` (default UA), robots/sitemap/llms block of `lib/crawler.ts`, `lib/audit/botAccess.ts`, `lib/audit/robotsRules.ts` |
| F-MEASURE | A-03, A-08 (parser side), A-09, A-10, A-11, A-14 | `lib/crawler.ts` (renderPage, parsePage), `lib/audit/collect.ts`, `lib/audit/htmlFacts.ts` |
| F-TRUTH | A-04, A-05, A-06, A-07, A-08 (report side), A-13, consuming A-02 | `lib/audit/finalize.ts`, `scoring.ts`, `contradiction.ts`, `contentSignals.ts`, `lib/deepseek.ts`, `src/components/EvidencePanel.tsx`, `lib/reportEvidence.ts` |
| Lead | A-12, integration, re-run, docs | `scripts/audit-corpus/*`, `docs/accuracy/*` |

Shared contract between fixers (so they do not collide):
`BotAccessResult` gains `inconclusive?: boolean` (refused, but not provably a block: IP-verified
crawler, or the site refuses every non-browser client) and `BotAccess` gains `baselineRefused?: boolean`
and `unreadableRobots?: boolean`. F-ACCESS produces them; F-TRUTH consumes them.
`CrawlResult` gains `pageKind?: 'normal' | 'challenge'` and `challengeReason?: string`. F-MEASURE
produces it; F-TRUTH consumes it.

Phase 3, verify (lead). Re-run all 30 sites and ground truth, regenerate sheets, diff against run 1,
confirm every fixed defect is gone and nothing new appeared. Sites whose findings changed get a second
independent read.

Phase 4. Update `FIX-LOG.md` with final status, `docs/accuracy/runs/<date2>/SUMMARY.md`, full test
suite, deploy.

## Definition of done

- Zero measurement mismatches that are scanner errors (ground-truth tool errors are fixed in the tool).
- Zero findings a reviewer judges false, misleading or unsupported.
- Each fix has a regression test and a log entry.
