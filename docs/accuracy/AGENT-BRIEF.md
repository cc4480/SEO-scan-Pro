# Brief for every agent working on the accuracy programme

Read `docs/accuracy/PLAN.md` first (issue register, owners, shared contract).

## The product

SEO Scan Pro (repo: `C:\Users\cc448\SEO-scan-Pro`, Windows, Git Bash and PowerShell available) audits a
website: `lib/crawler.ts` renders it in headless Chromium and measures it, `lib/audit/*` collects
extra evidence (crawler access, raw vs rendered, schema, sections) and fact-checks the AI's written
report (`lib/audit/finalize.ts`, `contradiction.ts`) and computes the scores (`lib/audit/scoring.ts`),
`lib/deepseek.ts` asks the AI model to write the report. The goal of this programme: every finding the
user sees must be TRUE.

## The data

For each of 30 sites (`audit-corpus/urls.json`, ids like `05-nytimes`):

- `audit-corpus/results/<id>.json` : what the scanner measured and what the report says
  (`crawl.mainPage`, `crawl.facts`, `report.criticalIssues`, `report.recommendedFixes`, `report.score`,
  `report.scoreBreakdown`, `report.qa`, and the scan's event log `events`).
- `audit-corpus/ground/<id>.json` : an INDEPENDENT measurement of the same page (separate Chromium,
  live DOM queries, a JavaScript-disabled load, plain HTTP requests for robots/sitemap/llms/headers and
  for each crawler user agent).
- `docs/accuracy/runs/2026-09-30/<id>.md` : a sheet comparing the two, with the report's findings and
  automatic "claim flags". The flags are NOISY (they mislabel sentences like "search crawlers were let
  through"); treat them as hints, not verdicts.

Sites change between requests (bot defences, A/B variants, lazy loading): when scanner and ground
truth disagree, decide which one matches what a real visitor/crawler gets by checking the live site
yourself (curl with a browser User-Agent, or a small puppeteer script). Do not assume either is right.

## Rules for everyone

- Do NOT commit, push, deploy, touch the database, or run `railway`. The lead does that.
- Do NOT run the full test suite or integration tests (they share one Postgres). Unit tests only:
  `npx vitest run tests/unit/<file>`; type-check with `npx tsc --noEmit` (other agents are editing
  other files at the same time, so a transient error in a file you do not own is not yours: re-run).
- Put scratch scripts in `C:\Users\cc448\AppData\Local\Temp\claude\C--Users-cc448\c099dcd5-59d8-4db2-aa0e-286814abba02\scratchpad\`,
  never in the repo, and delete anything you create elsewhere.
- Be polite to the live sites: a handful of requests per site, no loops, no load.
- IMPORTANT, environment quirk: shell heredocs in this environment mangle backslashes (regexes like
  `\b` and `\d` silently lose them, or turn into control characters). Write or edit any code that
  contains a backslash with the Write / Edit tools, never with `node - <<EOF`, `sed` or `cat <<EOF`.
  After editing, check there are no stray control characters: `grep -rlP "[\x00-\x08\x0B\x0C\x0E-\x1F]" lib src tests scripts`.
- Match the surrounding code style and comment density. Comments explain WHY.

## Reviewer procedure (read-only agents)

For each assigned site, read its sheet and its `results` + `ground` JSON, then for EVERY critical issue and
EVERY fix in the report decide: ACCURATE / INACCURATE / MISLEADING / UNSUPPORTED (the claim cannot be
verified from evidence the tool had) / SUBJECTIVE (a judgement; say whether reasonable). Verify doubtful
claims live. Also check the scanner's measurements against ground truth and explain every mismatch (scanner
bug, ground-truth tool bug, or the site served different content). Then:

1. Replace the `## Reviewer verdict` section at the bottom of the sheet with your verdict: a short
   summary, then one line per finding number: `N. VERDICT: reason`. Be specific and brief.
2. Append every NEW defect (not already in the issue register) to `docs/accuracy/issues/<batch>.md`
   with: site, finding number, symptom, evidence (what you checked), suspected root cause (file/function if
   you can tell), a proposed fix, and which issue it may relate to. Also note register issues you
   confirmed on your sites (just the id and site).
3. Do not edit any code.

Your final message must list: per site, counts of ACCURATE / INACCURATE / MISLEADING / UNSUPPORTED /
SUBJECTIVE, plus the new defects in one line each.

## Fixer procedure (agents that change code)

For each assigned issue: reproduce it from the evidence, find the root cause, fix it at the root (not by
special-casing a site), add a regression test in `tests/unit/` that fails before and passes after, and
append an entry to `docs/accuracy/FIX-LOG.md` using the template at the top of that file. Stay inside
the files your package owns; if a fix needs a change elsewhere, make the smallest possible edit and say
so in the log. Keep every existing test passing. Finish by running `npx tsc --noEmit` and the unit tests
you touched, and report: what changed (files), which issues are fixed, which could not be and why.
