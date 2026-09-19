# SEO Scan Pro

An enterprise-grade, white-label SEO audit platform. Crawls a target site, runs the results through an AI (Gemini) SEO/AEO/GEO analysis engine, and produces a branded, downloadable audit report — with historical comparisons, competitor benchmarking, and an embeddable lead-capture widget for agencies.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Express + TypeScript (`tsx`)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (bearer tokens) + bcrypt password hashing
- **AI:** Google Gemini (`@google/genai`), with a deterministic fallback report generator when no API key is configured
- **Security:** helmet, CORS allowlist, rate limiting (`express-rate-limit`), zod request validation

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
   GEMINI_API_KEY="your-gemini-api-key"       # optional — falls back to simulator mode if unset
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
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`, then register an account to get started — every scan, setting, and widget lead is scoped to your account.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Vite + Express, hot reload) |
| `npm run build` | Build the frontend and bundle the server for production |
| `npm start` | Run the production build (`dist/server.cjs`) |
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

- **Site audits** — single-page or multi-page crawl (`lib/crawler.ts`), analyzing meta tags, headings, images/alt text, internal/external links, structured data (JSON-LD), and sitemap presence.
- **AI-generated reports** — technical, content, AEO/GEO, and performance scoring with prioritized fixes, via Gemini (`lib/deepseek.ts`). If a target site can't be reached, the report is clearly flagged as simulated (`isSimulated`/`hasSimulatedData`) rather than presented as a real result.
- **White-label branding** — custom agency name, logo, colors, and footer, reflected in both the live dashboard and the downloadable report.
- **Historical comparison** — chronological score deltas across repeat scans of the same domain.
- **Embeddable lead-capture widget** — an iframe (`/embed?key=<widgetKey>`) agencies can drop on their own site; leads are attributed to the correct account via a per-user `widgetKey`, and are rate-limited.
- **Competitor benchmark** — comparison matrix against other SEO tools.

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
  crawler.ts            Regex-based HTML crawler
  deepseek.ts            Gemini-backed SEO report generator (+ offline fallback)
  db.ts                  Prisma client singleton
  auth.ts                JWT + bcrypt helpers
  authMiddleware.ts        Express auth middleware
  validation.ts             zod request schemas
  env.ts                     Startup environment validation
prisma/
  schema.prisma            Users, scans, white-label settings
src/
  App.tsx                    Top-level app shell + auth flow
  components/
    Auth/                       Login/register forms
    ScanForm.tsx, ReportDashboard.tsx, ReportComparison.tsx,
    WhiteLabelEditor.tsx, WidgetEmbedBuilder.tsx, EmbedView.tsx,
    CompetitorBenchmark.tsx
```

## Known Limitations

- The crawler parses raw HTML via regex — it does not execute JavaScript, so client-rendered (SPA) sites will audit as mostly empty.
- "Export White-Label Report" downloads a standalone HTML file styled for browser print-to-PDF, not a server-generated PDF.
- No password reset flow yet — see `AUTH_IMPLEMENTATION.md` for the current auth surface.
