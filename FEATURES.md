# SeoScan — Feature Documentation

An enterprise-grade, white-label SEO audit platform. It crawls a target website in a real headless browser, runs the results through the DeepSeek AI analysis engine, and produces a branded, downloadable audit report — with historical comparisons, competitor benchmarking, and an embeddable lead-capture widget for agencies.

> **Stack:** React 19 + Vite + Tailwind CSS · Express + TypeScript · PostgreSQL (Prisma) · DeepSeek (`deepseek-chat`) · Puppeteer (headless Chromium).

---

## 1. Site Auditing (Crawler)

The crawler (`lib/crawler.ts`) renders pages in a real headless browser rather than a plain `fetch()`, so JavaScript-rendered and single-page-application content is analysed, not just static HTML.

### 1.1 Scan modes

| Mode | Behaviour |
|---|---|
| **Single URL Scan** | Crawls and analyses the target page only. |
| **Deep Site Crawl (Full Site)** | Crawls the target plus internal sub-pages, up to a configurable depth (2–5 levels, capped at 4 additional pages). |

### 1.2 What is checked (in pipeline order)

1. **Target resolution & validation** — the URL is normalised (`https://` prefixed if missing) and refused up-front if it resolves to a private/reserved address (SSRF guard).
2. **`robots.txt` & sitemap** — `robots.txt` is fetched to discover any `Sitemap:` directive; the sitemap URL is then verified. `sitemapFound` and `sitemapUrl` are recorded.
3. **`llms.txt`** — `/llms.txt` is fetched and its presence recorded (`llmsTxtFound`), so the AI can state definitively whether AI-crawler guidance exists.
4. **Headless rendering** — the page is loaded in Chromium with `networkidle2`, capturing the post-JavaScript DOM.
5. **Meta tags** — `title`, `description`, `keywords`, `viewport`, `robots`, and `canonical`.
6. **Heading structure** — `H1`, `H2`, `H3` (with HTML-entity decoding).
7. **Images** — total count, missing/empty `alt` count, and a sample list (capped at 30).
8. **Links** — total, internal vs external classification, and a sample list with anchor text (capped at 50).
9. **Structured data (JSON-LD)** — every `@type` is extracted **recursively**, including `@graph` wrappers, array-valued `@type`, and types nested inside properties (`mainEntity`, `itemListElement`, …).
10. **Additional checks** (all optional on stored scans — a missing field means "not checked"):
    - **Security headers & HTTPS** — HSTS, CSP, X-Frame-Options/`frame-ancestors`, `X-Content-Type-Options`, Referrer-Policy, read from the real response.
    - **Redirect chain** — every hop from the requested URL to the final page.
    - **Broken links** — a *sample* (up to 15 internal + 5 external) probed through the SSRF-guarded fetcher. Only 404/410/5xx and DNS failures count; 401/403/429 and timeouts are ignored, and the sample size is reported. Time-boxed to 8 s.
    - **Open Graph / Twitter Card**, **hreflang**, **`<html lang>`**, **visible word count**.
    - **Lab Core Web Vitals** — LCP and CLS observed in the crawler's browser; labelled lab data from the scanning host, not real-user data.
    - **Duplicate titles/descriptions** across the pages of a Deep Site Crawl.
    - **`robots.txt` site-wide block** — `User-agent: *` + `Disallow: /`.
11. **Performance** — `loadTimeMs` (from the page's own navigation timing) and `ttfbMs` (time-to-first-byte) recorded separately so network latency is not mistaken for the site's speed.

### 1.3 Simulated-data fallback

If a target site cannot be reached (offline, blocked, timed out, non-OK status), the scan falls back to illustrative placeholder data. This is **always flagged** via `hasSimulatedData`, and the report and dashboard both display a prominent "Simulated Data — Not a Real Audit" warning.

---

## 2. AI Analysis (DeepSeek)

`lib/deepseek.ts` sends the structured crawl payload to DeepSeek and returns a full, JSON-formatted audit.

### 2.1 Model & API

- Model: `deepseek-chat` (configurable via `DEEPSEEK_MODEL`).
- Endpoint: `https://api.deepseek.com/chat/completions` (configurable via `DEEPSEEK_BASE_URL`).
- JSON output mode (`response_format: json_object`), with defensive markdown-fence stripping.

### 2.2 Report contents

| Field | Description |
|---|---|
| **`score`** | Five 0–100 scores: `overall`, `technical`, `content`, `aeoGeo`, `performance`. |
| **`executiveSummary`** | Strategic high-level review. |
| **`criticalIssues`** | List of top severe problems. |
| **`recommendedFixes`** | Structured fixes — each with `title`, `category` (technical / content / aeo-geo / performance), `priority` (high / medium / low), `description`, and `remediation`. |
| **`aeoAssessment`** | AEO/GEO-specific: `generativeFriendlinessScore`, `directAnswerFriendliness`, `richSnippetEligibility` (schema types the site qualifies for), `voiceSearchOptimized`, `recommendationsForAeo`. |
| **`competitorComparisonText`** | Competitive positioning narrative. |

### 2.3 Evidence rules (false-positive prevention)

The AI prompt enforces strict evidence rules: every finding must be supported by the crawled payload; the model must **not** assert that something is absent unless the crawler actually verified its absence (e.g. `llms.txt`, schema types); a TTFB-dominated load time is reported as a network-bound measurement rather than a front-end performance failure; multiple `<h1>` elements are not raised as critical; decorative empty `alt` is treated as an accessibility item, not a ranking failure.

### 2.3b Measured evidence and the accuracy check

The AI writes the narrative, but it cannot look at the site, so every report is checked against what the scanner actually measured (`lib/audit`):

- **Crawler access** — the home page is requested once per crawler with its published user agent (GPTBot, ClaudeBot, CCBot, Bytespider, OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot, Applebot, ChatGPT-User, Claude-User, Perplexity-User). A 401/403/406/429 while a normal request succeeds is "blocked", and any crawler that robots.txt allows but the site refuses is reported as a conflict. Blocking AI-*training* crawlers is treated as an owner policy decision; blocked search or assistant crawlers are a real problem.
- **Raw HTML vs rendered** — words, real `<a href>` links and schema types are counted both in a plain no-JavaScript response and in the browser-rendered DOM, so JavaScript-dependent content, schema that only exists after scripts run, and navigation built from buttons are visible.
- **Structured data contents** — each JSON-LD entity's real properties, offers and prices; HowTo steps and FAQ questions are compared with the visible text.
- **Visible sections and prices** — which sections (pricing, FAQ, how it works…) the page has, and the prices it shows.
- **The checker** — every AI suggestion is tested against that evidence. It is dropped, with the reason recorded and shown in the report, when it asks for something the page already has (schema properties, sections, files), for alt text on a page with no images, for hreflang on a single-language site, for rating/review markup without genuine reviews, for an invented price, or when it tells the reader to validate FAQ/HowTo markup in the Rich Results Test (those rich results no longer exist). Findings that need no judgement (blocked crawlers, JavaScript dependence, invisible markup) are added from the measurements.
- **Scores are computed, not written** — `lib/audit/scoring.ts` starts each category at 100 and deducts for specific measured findings; every deduction is listed in the report, so a site always scores the same.

### 2.4 Offline fallback

When no `DEEPSEEK_API_KEY` is configured, or when the DeepSeek call fails, the app generates a **deterministic local report** (`generateSimulatorReport`) from the crawl statistics, so the workflow never breaks.

### 2.5 Agent-ready prompt

Every audit also produces a **copy-pasteable hand-off prompt** for a coding agent (Claude Code, Cursor, Copilot, …):

- `title` — a short imperative task title.
- `prompt` — a complete brief containing the site, the scores, critical issues, every fix with priority/category/problem/change, implementation rules, and a definition-of-done checklist.
- `checklist` — one verifiable task per fix.

DeepSeek writes this; if it omits or malforms it, a deterministic builder (`src/agentPrompt.ts`) produces the same structure. Shown in the dashboard with a copy button and embedded in the exported PDF/HTML.

---

## 3. Reports & Export

### 3.1 Live dashboard

The full report renders in-app: five score gauges, executive summary, critical-issue red flags, a filterable/tickable fix checklist with completion percentage, crawl technical metrics, heading/image accordions, and the AEO/GEO assessment.

### 3.2 Export formats

| Format | Details |
|---|---|
| **PDF** | Server-rendered via Puppeteer (`?format=pdf`) — a real PDF with the branded layout and print styling. |
| **HTML** | A standalone, self-contained styled HTML document (one-click print-to-PDF ready). |

Both exports include the white-label branding **and** the agent-ready prompt. Downloads are authenticated (the token is attached, and the file is saved as a blob — see §9).

---

## 4. White-Label Branding

Per-account agency branding, reflected in both the dashboard and exports:

- **Agency name**
- **Logo URL**
- **Primary & accent colors** (validated against injection)
- **Custom footer**
- **Enabled report sections** (executive, technical, content, aeo-geo, checklist)
- **Language** (English / Spanish)

---

## 5. Lead Capture & Embeddable Widget

### 5.1 Widget

- Public iframe endpoint: `/embed?key=<widgetKey>`.
- Visitors submit their domain + email + name; the resulting scan is attributed to the owning agency account via a per-user `widgetKey`.
- The widget polls a public status endpoint (`GET /api/widget/scan/:id`) to display the score, critical-issue count, and executive summary once the async scan completes, and offers a **Download PDF Report** link.
- Rate-limited (5/hour for anonymous visitors; the signed-in owner testing their own embed gets a separate 200/hour bucket).

### 5.2 In-app widget builder

The dashboard's "Client Lead Widget" tab generates the copy-paste `<iframe>` snippet and includes a **live preview** that exercises the real widget.

### 5.3 HMAC-signed webhooks

When a widget lead completes, the agency's configured webhook URL receives a `POST` with an `X-SEOScan-Signature` header (HMAC-SHA256 of the body using the account's webhook secret). Payload includes event, timestamp, agency name, scan id, target URL, lead email/name, overall score, and critical-issue count.

---

## 6. Account & Authentication

- **Register / login** — JWT bearer tokens (HS256, default 7-day expiry), bcrypt password hashing (cost 10). Each token carries the user's `tokenVersion`; "Sign out everywhere" and any password change/reset bump it, instantly invalidating every earlier token.
- **Password reset** — email-based flow; 32-byte cryptographically-random tokens, stored SHA-256-hashed, 1-hour expiry, single-use, previous tokens invalidated on reissue. The email is sent through Resend; the reset link is never logged and only returned in API responses when `RETURN_RESET_LINK_IN_RESPONSE=true` (developer machines only).
- **Account management** — change password, change email, and delete account; all require re-confirming the current password.

---

## 7. Comparisons & Benchmarking

- **Chronological delta** — compare a scan against earlier scans of the same domain, with score deltas (overall, technical, AEO/GEO, speed).
- **Competitor benchmark** — an illustrative comparison matrix against other SEO tools.

---

## 7b. Scheduled Monitoring & Alerts

- Per-URL monitors (daily or weekly, max 10 per account) create a scan on schedule; the first run is immediate, giving the trend a starting point.
- `GET /api/monitors/:id/history` feeds a score-over-time chart; simulated points are flagged.
- After each monitor scan, the overall score is compared with the previous completed scan. A drop of at least the monitor's `alertDrop` (default 5) emails the White-Label *monitoring email* (falling back to the account email) with the new critical issues — if **Email alerts** is on. Comparisons involving simulated data never alert.
- The scheduler ticks every 60 s and claims each due monitor with a conditional update, so overlapping ticks cannot double-run it. Requires `RESEND_API_KEY` + `EMAIL_FROM` to send.

## 7c. API Keys, Search & Export

- **API keys** (`ssp_…`): create/revoke in Account Settings; SHA-256 hashed at rest, plaintext shown once, `lastUsedAt` tracked. Usable on data routes; refused (403) on password/email/account-deletion/key-management routes.
- **Search/filter**: `q` (URL contains), `status`, `mode`, `leads`, `monitorId`, `from`, `to`, `page`, `limit`.
- **Export**: `/api/scans/export?format=csv|json` with the same filters. CSV cells that could run as spreadsheet formulas are neutralised.
- **Leads**: `/api/leads` — one row per widget lead with score and issue count.

## 8a. Live Audit Log (full transparency)

The scan screen is a terminal that shows what the scanner is really doing, line by line, as it does it. There is no timer-driven checklist and nothing is scripted.

- Every stage (target resolution, robots/sitemap, `llms.txt`, page render, meta, headings, images, links, structured data, security headers, performance, AI analysis, agent prompt) emits real events: the request it made, the value it measured (`title (61 chars): "…"`, `HTTP 200 · DOM captured (568KB)`, each link probe's status code), or the fallback it took.
- Long waits show heartbeats (`still loading… (8s so far)`, `still waiting for DeepSeek to finish writing the report`) plus real browser lifecycle events (main document answered, DOMContentLoaded, load, network idle, request count).
- Fallbacks are stated plainly, never hidden: `DEEPSEEK_API_KEY is not configured: using the OFFLINE generator`, `DeepSeek failed (…): this report is NOT AI-written`, `render failed … PLACEHOLDER data is used and the report will be flagged as simulated`. The API key is never logged.
- If the page loaded but the network never went idle within the timeout, the real DOM is analysed (and the log says so) instead of being replaced by placeholder data.
- `GET /api/scans/:id/events?after=N` streams new lines (owner-only). The whole log is saved with the scan, including failed scans, and shows in the report under **Audit log**.

## 8. Live Audit Progress

While a scan runs, a **12-stage checklist** ("Live audit — what's being checked") animates through the real pipeline — queued → checking → done — with a `n/12` counter. It holds on the final step until the scan actually completes. When the report lands, the page scrolls to the top automatically.

---

## 9. Security

- **Authentication** — all scan/settings/report routes require a valid JWT (except the public widget endpoints and `/api/health`). Tokens are verified with a pinned `HS256` algorithm and must carry a valid `userId`.
- **Authorization / data isolation** — every query is scoped by `userId`; no cross-tenant access paths exist. Reset-token comparison is hash-only; login/forgot-password responses are uniform to prevent account enumeration.
- **SSRF protection** — `safeFetch` validates the IP actually used (defeating DNS rebinding) for `robots.txt`, attacker-controlled sitemap URLs, and webhooks; the browser crawler intercepts every request by hostname **and** re-checks the real peer address of every response.
- **Rate limiting** — auth (10/15 min), widget scan (5/hr anonymous), widget status (400/15 min), scan creation (30/15 min), report download (60/15 min).
- **Cost control** — scans run through a bounded queue (`SCAN_CONCURRENCY`, default 2) and each account may have at most `MAX_PENDING_SCANS` (default 5) queued/running; beyond that `POST /api/scan` returns 429. Scans orphaned by a restart are marked FAILED at boot.
- **Input validation** — all request bodies are validated with zod; unknown keys are stripped (no mass assignment).
- **Headers** — helmet security headers (CSP off only for the report HTML, which injects inline Tailwind); CORS allowlist covering `localhost`, `127.0.0.1`, and `[::1]`.
- **Secrets** — `JWT_SECRET` must be a unique ≥32-char value (known placeholders are refused at boot); `.env` is gitignored.

---

## 10. Configuration (environment variables)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string. |
| `JWT_SECRET` | ✅ | — | Signing secret (≥32 chars; unique, not a placeholder). |
| `JWT_EXPIRY` | — | `7d` | Token lifetime. |
| `APP_URL` | — | `http://localhost:<PORT>` | Public origin (CORS + reset links). |
| `PORT` | — | `3000` | HTTP listen port. |
| `DEEPSEEK_API_KEY` | — | — | DeepSeek key; unset → simulator fallback. |
| `DEEPSEEK_MODEL` | — | `deepseek-chat` | Model name. |
| `DEEPSEEK_BASE_URL` | — | `https://api.deepseek.com` | API base URL. |
| `RESEND_API_KEY` | — | — | Resend key for reset + alert emails; unset → emails skipped. |
| `EMAIL_FROM` | — | — | Verified Resend sender, e.g. `SeoScan <alerts@yourdomain.com>`. |
| `SCAN_CONCURRENCY` | — | `2` | Scans allowed to run at once. |
| `MAX_PENDING_SCANS` | — | `5` | Queued/running scans allowed per account. |
| `RETURN_RESET_LINK_IN_RESPONSE` | — | *(unset)* | **Dev only** — include the reset link in API responses. |

---

## 11. API Endpoints (summary)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account. |
| `POST` | `/api/auth/login` | — | Sign in, returns JWT. |
| `POST` | `/api/auth/forgot-password` | — | Request reset. |
| `POST` | `/api/auth/reset-password` | — | Complete reset. |
| `GET` | `/api/auth/me` | ✅ | Current user + `widgetKey`. |
| `PATCH` | `/api/auth/change-password` | ✅ | Change password. |
| `PATCH` | `/api/auth/change-email` | ✅ | Change email. |
| `DELETE` | `/api/auth/account` | ✅ | Delete account. |
| `GET` | `/api/scans` | ✅ | List scans (paginated, `X-Total-Count`; filters `q,status,mode,leads,monitorId,from,to`). |
| `GET` | `/api/scans/export` | ✅ | Export scans as CSV (default) or `?format=json`; same filters. |
| `GET` | `/api/leads` | ✅ | Widget leads (paginated, `X-Total-Count`). |
| `POST` | `/api/auth/logout-all` | ✅ (session) | Invalidate all other sessions; returns a fresh token. |
| `GET` `POST` `DELETE` | `/api/api-keys[/:id]` | ✅ (session) | List / create (plaintext returned once) / revoke API keys. |
| `GET` `POST` | `/api/monitors` | ✅ | List / create scheduled monitors. |
| `PATCH` `DELETE` | `/api/monitors/:id` | ✅ | Pause/resume or retune / delete a monitor. |
| `GET` | `/api/monitors/:id/history` | ✅ | Score history (oldest first) for the trend chart. |
| `GET` | `/api/scans/:id` | ✅ | Get one scan. |
| `DELETE` | `/api/scans/:id` | ✅ | Delete a scan. |
| `POST` | `/api/scan` | ✅ | Queue a scan (202, async). |
| `GET` | `/api/settings` | ✅ | Get white-label settings. |
| `POST` | `/api/settings` | ✅ | Update white-label settings. |
| `POST` | `/api/widget/scan` | — | Public widget lead scan. |
| `GET` | `/api/widget/scan/:id` | — | Public widget status (lead scans only). |
| `GET` | `/api/report/:id/download` | optional | Download report (HTML; `?format=pdf` for PDF). |
| `GET` | `/api/health` | — | Health check. |

---

## 12. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (Vite hot reload). |
| `npm run build` | Build the frontend + bundle the server (`dist/server.mjs`). |
| `npm start` | Run the production build. |
| `npm run lint` | Type-check (`tsc --noEmit`). |
| `npm test` | Run the full test suite (211 tests). |
