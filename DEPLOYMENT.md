# Deployment and launch checklist

Current production: Railway project `seoscan-pro` (services `web` + `Postgres`), served at the
`*.up.railway.app` URL. Status of everything needed to launch is below.

## Done in code

- Migrations apply on boot (`prisma migrate deploy` before the server starts); healthcheck at `/api/health`.
- Email verification (scans, monitors, API keys and the embed widget need a confirmed address; enforced
  only when `RESEND_API_KEY` + `EMAIL_FROM` are set). Existing accounts were grandfathered.
- Abuse and cost limits: 5 accounts/hour/network, per-window scan limits, per-account backlog cap, and a
  daily scan allowance (`DAILY_SCAN_LIMIT`, default 25).
- HSTS in production, Content-Security-Policy on app pages, framing denied except `/embed`.
- JSON 404s for unknown API routes, JSON errors for malformed requests, crash logging.
- `/terms` and `/privacy`, consent notice at signup, `robots.txt`, `sitemap.xml`, canonical + Open Graph
  tags, favicon/manifest/social image.
- `npm audit --omit=dev`: 0 vulnerabilities.

## Needs you (account access or a decision)

1. **Billing.** Nothing charges yet and there is no plan/quota model beyond the daily allowance. Decide
   pricing, then add Stripe (plans, checkout, webhook, per-plan limits). Until then the Terms say the
   service "may be offered free of charge for now".
2. **Custom domain.** Add it in Railway (Settings → Networking), then set `APP_URL` to it (drives CORS,
   email links, canonical/OG URLs). If Cloudflare proxies it, set `TRUST_PROXY_HOPS=2`.
3. **Email sender.** `EMAIL_FROM` must be on a domain verified in Resend (SPF/DKIM). Until the
   verification email is proven to arrive, new signups cannot run scans. Test with a real inbox and with
   `bounced@resend.dev`. Set `SUPPORT_EMAIL` so the legal pages show a contact address.
4. **Legal review.** `src/legal/content.ts` is a solid starting draft that matches what the app does, not
   legal advice. Add governing-law and company details if your counsel wants them.
5. **Auto-deploy.** Connect the GitHub repo to the `web` service in Railway, or keep deploying with
   `railway up --service web`.
6. **Monitoring.** Add an external uptime check on `/api/health` and, if wanted, an error tracker
   (e.g. Sentry). Logs are in Railway; unhandled errors are logged with a `[error]` / `[unhandledRejection]` prefix.
7. **Backups.** Run `~/seoscan-pro-backup.ps1` (opens a temporary TCP proxy, dumps, closes it) before
   launch and on a schedule; restore-test once. Also enable Railway's backups/PITR on the Postgres service.
8. **Railway config format.** `railway.json` keeps working until 2026-12-01; migrate with
   `railway config migrate` before then.

## Operational notes

- Run exactly one replica: the scan queue and monitor scheduler are in-process.
- Leave `RETURN_RESET_LINK_IN_RESPONSE` unset in production.
- Rotate `JWT_SECRET` only when you are prepared to sign everyone out.
