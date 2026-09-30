# SEO Scan Pro

An enterprise-grade, white-label SEO audit platform. Crawls a target site, runs the results through an AI (DeepSeek) SEO/AEO/GEO analysis engine, and produces a branded, downloadable audit report — with historical comparisons, competitor benchmarking, and an embeddable lead-capture widget for agencies.

> 📘 **Full feature reference** — every feature in explicit detail: **[FEATURES.md](FEATURES.md)**

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Express + TypeScript (`tsx`)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (bearer tokens) + bcrypt password hashing
- **AI:** DeepSeek (`deepseek-chat` via the OpenAI-compatible API), with a deterministic fallback report generator when no API key is configured
- **Rendering:** Puppeteer (headless Chromium) — used both for crawling (captures JS-rendered content, not just static HTML) and for generating real PDF report exports
- **Security:** helmet, CORS allowlist, rate limiting (`express-rate-limit`), zod request validation, HMAC-signed outbound webhooks

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally or accessible via connection string

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env` and fill in:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/seoscan"
   DEEPSEEK_API_KEY="your-deepseek-api-key"       # optional — falls back to simulator mode if unset
   JWT_SECRET="a-random-string-32-chars-min"
   JWT_EXPIRY="7d"
   APP_URL="http://localhost:3000"
   ```
   Server startup validates these and fails fast with a clear error if `DATABASE_URL`/`JWT_SECRET` are missing or invalid — see `lib/env.ts`.

   First-time local PostgreSQL setup (creating the database, troubleshooting auth) is covered in **[POSTGRES_SETUP.md](POSTGRES_SETUP.md)**.

3. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the app**

   For local development (Vite hot reload):
   ```bash
   npm run dev
   ```

   For a production run — a pre-built bundle that starts fast and does not depend on the Vite dev server:
   ```bash
   npm run build
   npm start
   ```

   Visit `http://localhost:3000`, then register an account to get started — every scan, setting, and widget lead is scoped to your account.

## Deploying (Railway / any Docker host)

The repo ships a `Dockerfile` (Node 22 + apt Chromium, non-root, `tini`) and `railway.json` (Dockerfile build, `/api/health` healthcheck, one replica). On start the container runs `prisma migrate deploy`, then the server; a failed migration stops the boot.

Set these variables on the service (see `.env.example` for all of them):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Railway Postgres reference variable. |
| `JWT_SECRET` | Unique, 32+ chars. The app refuses to boot on a placeholder. |
| `APP_URL` | The public origin, e.g. `https://app.example.com` — drives CORS and reset-email links. |
| `DEEPSEEK_API_KEY` | Without it every report comes from the offline fallback generator. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Without them password reset and alerts cannot send. |
| `TRUST_PROXY_HOPS` | Default `1` (Railway edge). Use `2` if Cloudflare also proxies in front; wrong values make per-IP rate limits share or forge the client IP. |

**Email verification:** new accounts must confirm their address (emailed link, valid 24h) before they can start scans, create monitors or API keys, and an unconfirmed owner's embed widget is inactive. This is enforced only when `RESEND_API_KEY` and `EMAIL_FROM` are both set — without a provider nobody could receive the link, so nothing is gated. Accounts that existed before the feature are grandfathered as verified. Changing an account's email un-verifies it.

**Crawler files:** `/robots.txt` and `/sitemap.xml` are generated from `APP_URL`. HSTS is sent when `NODE_ENV=production`; framing is denied everywhere except `/embed`.

Leave `RETURN_RESET_LINK_IN_RESPONSE` **unset**. Run exactly **one** replica: the scan queue and monitor scheduler are in-process. On SIGTERM (every redeploy) the server stops the scheduler, drains HTTP, closes Chromium and the database.

Local check of the image: `docker build -t seoscan .` then `docker run --rm -p 3000:3000 --env-file .env seoscan`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Vite + Express, hot reload) |
| `npm run build` | Build the frontend and bundle the server for production |
| `npm start` | Run the production build (`dist/server.mjs`) — run `npm run build` first |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Run the full test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma migrate dev` | Create/apply a migration after schema changes |

## Testing

Unit tests (`tests/unit/`) cover password/token handling, request validation schemas, rate limiting, and — highest priority — the crawler's HTML parsing logic, since it's regex-based and the least self-evidently correct code in the app. Integration tests (`tests/integration/`) exercise the real Express app via `supertest`, covering the full register/login/protected-route flow, cross-user data isolation, and the widget lead-capture ownership flow.

Integration tests run against a **separate** database (`seoscan_test`), never your dev database:

```bash
# one-time setup
createdb -U postgres -h localhost -p 5434 seoscan_test   # adjust host/port to match your setup
cp .env .env.test
# edit .env.test: point DATABASE_URL at seoscan_test, set NODE_ENV="test"

# apply migrations to the test database specifically (bash example; on Windows PowerShell
# set $env:DATABASE_URL first instead of the inline prefix)
DATABASE_URL="<value from .env.test>" npx prisma migrate deploy

npm test
```

`.env.test` is gitignored, same as `.env`.

## Features

- **Site audits** — single-page or multi-page crawl (`lib/crawler.ts`), rendered in a real headless browser (Puppeteer) so JavaScript-rendered/SPA content shows up, not just static HTML. Analyzes meta tags, headings, images/alt text, internal/external links, structured data (JSON-LD), and sitemap presence.
- **AI-generated reports** — technical, content, AEO/GEO, and performance scoring with prioritized fixes, via DeepSeek (`lib/deepseek.ts`). If a target site can't be reached, the report is clearly flagged as simulated (`isSimulated`/`hasSimulatedData`) rather than presented as a real result.
- **Agent-ready prompt** — every audit also produces a copy-pasteable hand-off prompt (title, task list, and a full instruction block) that can be given straight to a coding agent (Claude Code, Cursor, Copilot) to implement the fixes. Shown in the dashboard with a copy button and embedded in the exported PDF/HTML. Written by DeepSeek, with a deterministic fallback (`src/agentPrompt.ts`) so the field is never missing.
- **White-label branding** — custom agency name, logo, colors, and footer, reflected in both the live dashboard and the downloadable report.
- **Report export** — a real server-rendered PDF (`?format=pdf`, via Puppeteer) or the standalone HTML version.
- **Historical comparison** — chronological score deltas across repeat scans of the same domain.
- **Embeddable lead-capture widget** — an iframe (`/embed?key=<widgetKey>`) agencies can drop on their own site; leads are attributed to the correct account via a per-user `widgetKey`, and are rate-limited. Completed leads fire an HMAC-SHA256 signed webhook (`X-SEOScan-Signature` header) to the agency's configured URL, verifiable with the secret shown in White-Label Presets.
- **Account management** — change password, change email, delete account (all require re-confirming the current password), in addition to the email-based password reset flow.
- **Competitor benchmark** — comparison matrix against other SEO tools.
- **Scheduled monitoring** — a daily or weekly re-scan per URL (up to 10 per account), a score-trend chart, and an email alert when the overall score falls by a threshold you set. Alerts are skipped if either scan used simulated data. Configure the recipient in White-Label settings; sending needs `RESEND_API_KEY` + `EMAIL_FROM`.
- **More audit checks** — security headers/HTTPS, redirect chains, broken links (sampled, conservative), Open Graph/Twitter tags, hreflang, `<html lang>`, word count, lab Core Web Vitals (LCP/CLS, measured from the scanning host), duplicate titles/descriptions across a crawl, and a site-wide `robots.txt` block. Old scans that predate a check show "not checked", never a failure.
- **API keys** — long-lived `ssp_…` keys for scripts and CI (`Authorization: Bearer ssp_…`). Stored hashed; shown once. They work on the data routes (scans, monitors, leads, export) but cannot change passwords/email, delete the account or mint more keys.
- **Search, filter and export** — `GET /api/scans?q=&status=&mode=&leads=&from=&to=`, plus CSV/JSON export (`/api/scans/export`, formula-injection-safe) and a leads list (`/api/leads`).
- **Session revocation** — "Sign out everywhere", and changing/resetting a password invalidates every previously issued token (per-user `tokenVersion`).
- **Scan queue** — scans run through a bounded in-process queue (`SCAN_CONCURRENCY`), each account is capped on backlog (`MAX_PENDING_SCANS`), and scans orphaned by a restart are marked FAILED at boot instead of spinning forever.

## Authentication

All scan/settings/report endpoints (except the public widget) require a JWT bearer token:

```
Authorization: Bearer <token>
```

Register and login return a token; the frontend stores it in `localStorage` and attaches it to every API call. Full endpoint reference and auth flow details are in **[AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md)**.

## Project Structure

```
server.ts              Express app: routes, auth, rate limiting, report HTML generation
lib/
  crawler.ts            Puppeteer-rendered crawler + regex-based HTML parsing
  deepseek.ts            DeepSeek-backed SEO report generator (+ offline fallback)
  db.ts                  Prisma client singleton
  auth.ts                JWT + bcrypt helpers + password reset token generation
  authMiddleware.ts        Express auth middleware
  validation.ts             zod request schemas
  env.ts                     Startup environment validation
  email.ts                    Resend email: password reset + monitoring alerts (skipped when unconfigured)
  queue.ts / scanRunner.ts     Bounded scan queue, scan job, restart recovery
  scheduler.ts / alerts.ts      Monitor scheduler and score-drop alert logic
  exporters.ts                   CSV/JSON scan export (formula-injection-safe)
  webhook.ts                   HMAC-signed outbound webhook delivery
  browser.ts                    Shared lazily-launched Puppeteer browser instance
  pdf.ts                          HTML-to-PDF rendering (reuses lib/browser.ts)
prisma/
  schema.prisma            Users, scans, monitors, API keys, white-label settings, password reset tokens
src/
  App.tsx                    Top-level app shell + auth flow
  agentPrompt.ts               Deterministic agent hand-off prompt builder (shared by server + UI)
  widgetScan.ts                  Public widget scan-status polling helper
  components/
    Auth/                       Login/register/forgot-password/reset-password forms
    AccountSettings.tsx           Change password/email, delete account
    ScanForm.tsx, ReportDashboard.tsx, ReportComparison.tsx,
    WhiteLabelEditor.tsx, WidgetEmbedBuilder.tsx, EmbedView.tsx,
    CompetitorBenchmark.tsx, MonitorsPanel.tsx, LeadsPanel.tsx, AdditionalChecks.tsx
```

## Known Limitations

- **The frontend is not type-checked.** `@types/react` / `@types/react-dom` are not installed, so `import React from 'react'` resolves to `any` and `npm run lint` (`tsc --noEmit`) effectively only covers the server. Adding those two packages is worthwhile, but it surfaces errors across every `.tsx` file and belongs in its own change. `tsconfig.json` also has no `"strict"`, and there is no ESLint — so `react-hooks/rules-of-hooks` is not machine-enforced either.
- **Scan queue is in-process.** Concurrency and per-account backlog are capped (`SCAN_CONCURRENCY`, `MAX_PENDING_SCANS`), but the queue lives in memory and the scheduler assumes a single server process — scale out only after moving both to a shared store. Rate limits are still the only per-request cost control; there is no billing/quota layer.
- **The browser-path SSRF check is best-effort.** Requests are validated by hostname, and every response's real peer address is re-checked (which closes DNS rebinding as far as the application can), but complete protection requires denying container/host egress to private ranges at the network layer. `lib/browser.ts` also launches Chromium with `--no-sandbox`, which suits containers but should be paired with the egress rule above.
- Email goes through Resend (`lib/email.ts`); with `RESEND_API_KEY`/`EMAIL_FROM` unset it is skipped. The reset link is **never logged**, and is only returned in an API response when `RETURN_RESET_LINK_IN_RESPONSE=true`; on a host anyone else can reach that flag is a one-request account takeover, so leave it unset.
- The competitor benchmark tab is illustrative marketing copy, not live third-party data — wiring in a real provider (e.g. SimilarWeb) requires that provider's own paid API key as an app secret, which isn't configured.
- JWTs are revoked per user ("Sign out everywhere", password change/reset) but not individually; API keys are revoked one at a time.
- Puppeteer (headless Chromium) is a heavy dependency — expect a slower cold start and larger deploy footprint than the previous plain-`fetch()` crawler, and budget for it in your hosting plan's memory/CPU limits.
