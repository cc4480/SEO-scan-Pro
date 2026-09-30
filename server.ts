import 'dotenv/config';
import express from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/db';
import { hashPassword, verifyPassword, generateToken, generateResetToken, hashResetToken } from './lib/auth';
import { generateApiKey } from './lib/auth';
import { authMiddleware, optionalAuthMiddleware, requireSession, AuthRequest } from './lib/authMiddleware';
import { validateBody, registerSchema, loginSchema, scanCreateSchema, widgetScanSchema, settingsSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, changePasswordSchema, changeEmailSchema, deleteAccountSchema, monitorCreateSchema, monitorUpdateSchema, apiKeyCreateSchema, scanListQuerySchema } from './lib/validation';
import { validateEnv } from './lib/env';
import { sendPasswordResetEmail } from './lib/email';
import { issueVerificationEmail, consumeVerificationToken, requireVerifiedEmail, verificationRequired } from './lib/emailVerification';
import { queueScan, recoverStuckScans } from './lib/scanRunner';
import { startScheduler, stopScheduler, nextRunFrom } from './lib/scheduler';
import { closeBrowser } from './lib/browser';
import { toCsv, scanToRow, SCAN_CSV_COLUMNS } from './lib/exporters';
import { getProgress } from './lib/progress';
import { assertPublicUrl, SsrfBlockedError } from './lib/ssrfGuard';
import { renderHtmlToPdf } from './lib/pdf';
import { dailyScanLimit, scansInLast24h } from './lib/dailyQuota';
import { loadIndexTemplate, renderIndex, INDEXABLE_PATHS } from './lib/indexHtml';
import { contentSecurityPolicy } from './lib/csp';
import { Scan, WhiteLabelSettings } from './src/types';
import { buildAgentReadyPrompt } from './src/agentPrompt';

// In test runs, the integration suite makes far more than 10 auth calls across many
// independent test cases against the same shared limiter instance — a low production
// limit here would make the suite flaky/order-dependent rather than actually testing anything.
// Rate-limiting behavior itself is covered separately by a dedicated unit test with its own limiter.
const isTestEnv = process.env.NODE_ENV === 'test';

// Configurable so the app can run alongside other local services. 3000 is a popular default and
// is frequently already taken (Docker Compose stacks, other dev servers), which previously made
// the app impossible to start without editing source.
const PORT = Number(process.env.PORT) || 3000;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

// Account creation is the abuse entry point for everything that costs money (scans, email). The
// shared auth limiter is per-attempt; this one caps how many accounts a single network can open.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTestEnv ? 100000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' }
});

const widgetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTestEnv ? 100000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests from this device. Please try again later.' }
});

// The in-dashboard "Live Widget Embed Preview" calls this same public endpoint so it genuinely
// exercises the real widget — which meant an owner testing their embed a few times consumed the
// 5/hour visitor bucket and locked their own live widget out for an hour. Signed-in callers get
// a separate, far larger bucket; anonymous visitors keep the strict one.
const widgetPreviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTestEnv ? 100000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many preview scans. Please wait a few minutes and try again.' }
});

const widgetScanLimiter = (req: any, res: any, next: any) =>
  (req.userId ? widgetPreviewLimiter : widgetLimiter)(req, res, next);

// The widget polls for its result every few seconds while the crawl + AI pass run, so it
// needs a far higher ceiling than scan creation — otherwise the 5/hour widget limit above
// would be consumed by polling alone and the widget would appear broken.
const widgetStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many status checks. Please try again shortly.' }
});

// Scanning is the expensive operation here: every request launches a headless Chromium page,
// crawls the target and makes a billed DeepSeek call. Unthrottled, a single account could
// exhaust CPU/memory and run up cost without bound.
const scanCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scans queued. Please wait a few minutes and try again.' }
});

// Report export renders the HTML in a real browser on every request. Lead-scan reports are
// downloadable without auth, so this one is reachable unauthenticated and needs its own ceiling.
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many report downloads. Please try again shortly.' }
});

function maxPendingScans(): number {
  const n = Number(process.env.MAX_PENDING_SCANS);
  return Number.isInteger(n) && n > 0 ? n : 5;
}

export function createApp() {
  const app = express();

  // Behind Railway/Cloudflare every request arrives from the proxy's address. Without this,
  // req.ip is the proxy for EVERY caller, so all the per-IP rate limits above would be one
  // shared bucket (one noisy visitor locks out everybody). `1` trusts exactly one hop, so a
  // client cannot forge X-Forwarded-For to dodge a limit. Raise it only if another proxy
  // (e.g. Cloudflare in front of Railway) is added in front.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  // HSTS is only sent in production, where Railway serves the app over HTTPS. Locally it stays
  // off: over plain HTTP a browser would pin https://localhost and then fail to connect.
  // Framing is refused everywhere except /embed, the lead-capture widget agencies iframe into
  // their own sites. CSP stays off because the report HTML injects inline Tailwind/scripts.
  const isProd = process.env.NODE_ENV === 'production';
  app.use(helmet({
    contentSecurityPolicy: false,
    strictTransportSecurity: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    frameguard: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
  }));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/embed')) res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
  app.use(express.json());
  // `localhost` and `127.0.0.1` are the same server but different browser origins, and
  // users mix them freely when opening a local app — allow every loopback spelling.
  const allowedOrigins = new Set([
    process.env.APP_URL || `http://localhost:${PORT}`,
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    `http://[::1]:${PORT}`
  ]);
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true
  }));

  // ===== AUTHENTICATION ENDPOINTS =====

  // Register endpoint
  app.post('/api/auth/register', registerLimiter, authLimiter, validateBody(registerSchema), async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || undefined,
          settings: {
            create: {
              agencyName: 'SEO Scan Pro',
              primaryColor: '#0ea5e9',
              accentColor: '#1e40af',
              customFooter: 'Report provided by SEO Scan Pro • Powered by DeepSeek V4.',
              enabledSections: ['executive', 'technical', 'content', 'aeo-geo', 'checklist'],
              language: 'en'
            }
          }
        }
      });

      await issueVerificationEmail(user, process.env.APP_URL || `http://localhost:${PORT}`);

      const token = generateToken(user.id, user.tokenVersion);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: !verificationRequired(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', authLimiter, validateBody(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id, user.tokenVersion);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Request a password reset
  app.post('/api/auth/forgot-password', authLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      // Always respond the same way whether or not the account exists —
      // a different response would let an attacker enumerate registered emails.
      const genericResponse = { message: 'If an account with that email exists, a password reset link has been sent.' };

      if (!user) {
        return res.json(genericResponse);
      }

      // Invalidate any previous outstanding tokens for this user before issuing a new one.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

      const { token, tokenHash } = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { tokenHash, expiresAt, userId: user.id }
      });

      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const resetLink = `${appUrl}/?resetToken=${token}`;
      await sendPasswordResetEmail(user.email, resetLink);

      // NEVER gate a credential on NODE_ENV. The previous check was `NODE_ENV !== 'production'`
      // — but neither `npm run dev` nor `npm start` sets NODE_ENV, so on the default
      // configuration that expression was TRUE: anyone could POST any email address to this
      // endpoint and read a working reset token straight out of the JSON response, then use it
      // to take over the account. It also defeated the anti-enumeration design two lines above,
      // since only existing accounts came back with a token. Returning the link is now an
      // explicit opt-in that belongs only on a developer's own machine.
      const devFields =
        process.env.RETURN_RESET_LINK_IN_RESPONSE === 'true' ? { devResetLink: resetLink } : {};

      res.json({ ...genericResponse, ...devFields });
    } catch (err) {
      console.error('Forgot-password error:', err);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  });

  // Complete a password reset
  app.post('/api/auth/reset-password', authLimiter, validateBody(resetPasswordSchema), async (req, res) => {
    try {
      const { token, password } = req.body;
      const tokenHash = hashResetToken(token);

      const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
      }

      const hashedPassword = await hashPassword(password);

      await prisma.$transaction([
        prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword, tokenVersion: { increment: 1 } } }),
        prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
        // Any other outstanding tokens for this user are now moot.
        prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId, id: { not: resetToken.id } } })
      ]);

      res.json({ message: 'Password updated. You can now log in with your new password.' });
    } catch (err) {
      console.error('Reset-password error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Confirm an email address from the link sent at signup
  app.post('/api/auth/verify-email', authLimiter, validateBody(verifyEmailSchema), async (req, res) => {
    try {
      const ok = await consumeVerificationToken(req.body.token);
      if (!ok) return res.status(400).json({ error: 'This confirmation link is invalid or has expired. Request a new one from the app.' });
      res.json({ message: 'Email confirmed.' });
    } catch (err) {
      console.error('Verify-email error:', err);
      res.status(500).json({ error: 'Failed to confirm email' });
    }
  });

  // Send a fresh confirmation link to the signed-in user
  app.post('/api/auth/resend-verification', authMiddleware, requireSession, authLimiter, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.emailVerifiedAt) await issueVerificationEmail(user, process.env.APP_URL || `http://localhost:${PORT}`);
      res.json({ message: 'If your address still needs confirming, a new link is on its way.' });
    } catch (err) {
      console.error('Resend-verification error:', err);
      res.status(500).json({ error: 'Failed to send confirmation email' });
    }
  });

  // Health check
  // Reports unhealthy when the database is unreachable, so the platform restarts/holds traffic
  // instead of routing users to an instance that can only return 500s.
  app.get('/api/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', uptime: process.uptime() });
    } catch {
      res.status(503).json({ status: 'unhealthy', uptime: process.uptime() });
    }
  });

  // Crawler files are generated from APP_URL so the sitemap always carries the real origin.
  // The API and the widget frame are not content; only the landing page is worth indexing.
  const publicOrigin = () => (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /embed\n\nSitemap: ${publicOrigin()}/sitemap.xml\n`
    );
  });
  app.get('/sitemap.xml', (req, res) => {
    const urls = INDEXABLE_PATHS.map((p) => `  <url><loc>${publicOrigin()}${p}</loc></url>`).join('\n');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    );
  });

  // Non-secret deployment facts the legal pages need. SUPPORT_EMAIL is optional; without it the
  // pages simply omit the contact line rather than invent one.
  app.get('/api/public-config', (req, res) => {
    res.json({ supportEmail: process.env.SUPPORT_EMAIL || null });
  });

  // ===== PROTECTED ENDPOINTS (Require Authentication) =====

  // Get current user
  app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        widgetKey: user.widgetKey,
        // Deployments without an email provider cannot verify anyone, so nobody is held back.
        emailVerified: !!user.emailVerifiedAt || !verificationRequired(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Change password (while logged in — requires current password)
  app.patch('/api/auth/change-password', authMiddleware, requireSession, validateBody(changePasswordSchema), async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await hashPassword(newPassword);
      // Every other session (and any stolen token) dies with the old password; this session gets
      // a fresh token so the user is not logged out of the tab they are using.
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, tokenVersion: { increment: 1 } }
      });

      res.json({ success: true, token: generateToken(updated.id, updated.tokenVersion) });
    } catch (err) {
      console.error('Change-password error:', err);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Change email (requires current password)
  app.patch('/api/auth/change-email', authMiddleware, requireSession, validateBody(changeEmailSchema), async (req: AuthRequest, res) => {
    try {
      const { newEmail, currentPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: 'That email is already in use' });
      }

      const updated = await prisma.user.update({ where: { id: user.id }, data: { email: newEmail, emailVerifiedAt: null } });
      await issueVerificationEmail(updated, process.env.APP_URL || `http://localhost:${PORT}`);
      res.json({ success: true, email: updated.email });
    } catch (err) {
      console.error('Change-email error:', err);
      res.status(500).json({ error: 'Failed to change email' });
    }
  });

  // Delete account (requires current password) — cascades scans & settings via FK onDelete
  app.delete('/api/auth/account', authMiddleware, requireSession, validateBody(deleteAccountSchema), async (req: AuthRequest, res) => {
    try {
      const { currentPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      await prisma.user.delete({ where: { id: user.id } });
      res.json({ success: true });
    } catch (err) {
      console.error('Delete-account error:', err);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // Get user settings
  app.get('/api/settings', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const settings = await prisma.whiteLabelSettings.findUnique({
        where: { userId: req.userId }
      });
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Update user settings
  app.post('/api/settings', authMiddleware, validateBody(settingsSchema), async (req: AuthRequest, res) => {
    // Both URLs are fetched by this server later — the webhook on every lead,
    // the logo when a PDF report is rendered — so both are refused up front if
    // they point at a private address. (Each is re-checked when actually used:
    // DNS can change after it is saved.)
    for (const field of ['webhookUrl', 'logoUrl'] as const) {
      const value = req.body[field];
      if (typeof value === 'string' && value.trim()) {
        try {
          await assertPublicUrl(value.trim());
        } catch (err) {
          if (err instanceof SsrfBlockedError) {
            return res.status(400).json({ error: `${field === 'webhookUrl' ? 'Webhook URL' : 'Logo URL'}: ${err.message}` });
          }
          throw err;
        }
      }
    }
    try {
      const settings = await prisma.whiteLabelSettings.update({
        where: { userId: req.userId },
        data: {
          agencyName: req.body.agencyName,
          logoUrl: req.body.logoUrl,
          primaryColor: req.body.primaryColor,
          accentColor: req.body.accentColor,
          customFooter: req.body.customFooter,
          enabledSections: req.body.enabledSections,
          language: req.body.language,
          webhookUrl: req.body.webhookUrl,
          monitoringEmail: req.body.monitoringEmail,
          enableEmailAlerts: req.body.enableEmailAlerts
        }
      });
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Filters shared by the scan list and the exports. Every clause is ANDed onto the userId scope.
  const buildScanWhere = (userId: string | undefined, q: any) => {
    const where: any = { userId };
    if (q.q) where.url = { contains: q.q, mode: 'insensitive' };
    if (q.status) where.status = q.status;
    if (q.mode) where.mode = q.mode;
    if (q.leads === 'true') where.leadEmail = { not: null };
    if (q.monitorId) where.monitorId = q.monitorId;
    if (q.from || q.to) where.createdAt = { ...(q.from && { gte: q.from }), ...(q.to && { lte: q.to }) };
    return where;
  };

  // Get scans for user (search/filter via ?q=&status=&mode=&leads=&from=&to=&monitorId=)
  app.get('/api/scans', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const parsed = scanListQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query' });
      const query = parsed.data;

      // Capped + paginated to avoid an unbounded query as scan history grows.
      // Response stays a plain array for backward compatibility; total count comes back
      // via the X-Total-Count header for callers that want to build real pagination UI.
      const page = query.page ?? 1;
      const limit = query.limit ?? 50;
      const where = buildScanWhere(req.userId, query);

      const [scans, total] = await Promise.all([
        prisma.scan.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.scan.count({ where })
      ]);

      res.setHeader('X-Total-Count', total.toString());
      res.json(scans);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch scans' });
    }
  });

  // Export scans as CSV or JSON (same filters as the list). Declared before /api/scans/:id.
  app.get('/api/scans/export', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const parsed = scanListQuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query' });
      const scans = await prisma.scan.findMany({
        where: buildScanWhere(req.userId, parsed.data),
        orderBy: { createdAt: 'desc' },
        take: 5000
      });
      const rows = scans.map((sc) => scanToRow(sc as any));
      if (req.query.format === 'json') {
        res.setHeader('Content-Disposition', 'attachment; filename=seo_scans.json');
        return res.json(rows);
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=seo_scans.csv');
      res.send(toCsv(SCAN_CSV_COLUMNS, rows));
    } catch (err) {
      console.error('Export error:', err);
      res.status(500).json({ error: 'Failed to export scans' });
    }
  });

  // Leads captured by the embeddable widget: one row per lead scan.
  app.get('/api/leads', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const where = { userId: req.userId, leadEmail: { not: null } };
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const [scans, total] = await Promise.all([
        prisma.scan.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.scan.count({ where })
      ]);
      res.setHeader('X-Total-Count', total.toString());
      res.json(scans.map((sc) => ({
        scanId: sc.id,
        email: sc.leadEmail,
        name: sc.leadName,
        url: sc.url,
        status: sc.status,
        overallScore: (sc.seoReport as any)?.score?.overall ?? null,
        criticalIssuesCount: (sc.seoReport as any)?.criticalIssues?.length ?? 0,
        capturedAt: sc.createdAt
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  // Get single scan
  app.get('/api/scans/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const scan = await prisma.scan.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });
      if (!scan) {
        return res.status(404).json({ error: 'Scan not found' });
      }
      res.json(scan);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch scan' });
    }
  });

  // Live audit log: every request, measurement and fallback the scan has made so far.
  // `?after=N` returns only events past the first N, so a poller transfers each line once.
  // While the scan runs the log is served from memory; afterwards from the copy saved on the scan.
  app.get('/api/scans/:id/events', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const after = Math.max(0, parseInt(req.query.after as string) || 0);
      const scan = await prisma.scan.findFirst({ where: { id: req.params.id, userId: req.userId }, select: { status: true } });
      if (!scan) return res.status(404).json({ error: 'Scan not found' });

      let events = getProgress(req.params.id, req.userId!, after);
      if (events === null) {
        const saved = await prisma.scan.findFirst({ where: { id: req.params.id, userId: req.userId }, select: { crawlData: true } });
        const log = (saved?.crawlData as any)?.log;
        events = Array.isArray(log) ? log.slice(after) : [];
      }
      res.json({ status: scan.status, events, next: after + events.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch scan log' });
    }
  });

  // Delete a scan
  app.delete('/api/scans/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await prisma.scan.deleteMany({
        where: { id: req.params.id, userId: req.userId }
      });
      if (result.count === 0) {
        return res.status(404).json({ error: 'Scan not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete scan' });
    }
  });

  // Create new scan
  app.post('/api/scan', authMiddleware, requireVerifiedEmail, scanCreateLimiter, validateBody(scanCreateSchema), async (req: AuthRequest, res) => {
    try {
      const { url, mode, depth, leadEmail, leadName } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Refused before a scan record is created. This endpoint's URL is fetched
      // by a real browser on this server; a private address would turn it into
      // a proxy into the internal network.
      try {
        await assertPublicUrl(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      } catch (err) {
        if (err instanceof SsrfBlockedError) return res.status(400).json({ error: err.message });
        throw err;
      }

      // Per-user backlog cap: the queue bounds how many scans RUN at once, this bounds how many
      // one account can have waiting, so a single user cannot fill the queue for everyone.
      const backlog = await prisma.scan.count({ where: { userId: req.userId, status: 'PENDING' } });
      if (backlog >= maxPendingScans()) {
        return res.status(429).json({ error: `You already have ${backlog} scans in progress. Wait for some to finish before starting more.` });
      }

      // Daily allowance: the burst limits above do not stop a slow drip from one account.
      const usedToday = await scansInLast24h(req.userId!);
      if (usedToday >= dailyScanLimit()) {
        return res.status(429).json({ error: `You have reached today's limit of ${dailyScanLimit()} scans. It resets on a rolling 24-hour basis.`, code: 'DAILY_LIMIT' });
      }

      const newScan = await prisma.scan.create({
        data: {
          url,
          mode: mode === 'FULL_SITE' ? 'FULL_SITE' : 'SINGLE',
          depth: parseInt(depth) || 1,
          status: 'PENDING',
          leadEmail,
          leadName,
          userId: req.userId
        }
      });

      // Queued, not run inline: lib/queue.ts limits how many scans execute concurrently.
      queueScan(newScan.id, url, newScan.mode as 'SINGLE' | 'FULL_SITE', newScan.depth, req.userId!);

      res.status(202).json(newScan);
    } catch (err: any) {
      console.error('Scan creation error:', err);
      res.status(500).json({ error: 'Failed to create scan' });
    }
  });

  // ===== SESSIONS & API KEYS =====

  // "Log out everywhere": invalidates every previously issued JWT for this account. API keys are
  // unaffected (revoke those individually). The caller gets a fresh token so this tab keeps working.
  app.post('/api/auth/logout-all', authMiddleware, requireSession, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.update({ where: { id: req.userId }, data: { tokenVersion: { increment: 1 } } });
      res.json({ success: true, token: generateToken(user.id, user.tokenVersion) });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sign out other sessions' });
    }
  });

  app.get('/api/api-keys', authMiddleware, requireSession, async (req: AuthRequest, res) => {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true }
      });
      res.json(keys);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/api-keys', authMiddleware, requireSession, requireVerifiedEmail, validateBody(apiKeyCreateSchema), async (req: AuthRequest, res) => {
    try {
      if ((await prisma.apiKey.count({ where: { userId: req.userId } })) >= 10) {
        return res.status(400).json({ error: 'You can have at most 10 API keys. Revoke one first.' });
      }
      const { key, prefix, keyHash } = generateApiKey();
      const created = await prisma.apiKey.create({ data: { name: req.body.name, prefix, keyHash, userId: req.userId! } });
      // The plaintext key exists only in this response; only its hash is stored.
      res.status(201).json({ id: created.id, name: created.name, prefix, createdAt: created.createdAt, key });
    } catch (err) {
      console.error('API key create error:', err);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });

  app.delete('/api/api-keys/:id', authMiddleware, requireSession, async (req: AuthRequest, res) => {
    try {
      const result = await prisma.apiKey.deleteMany({ where: { id: req.params.id, userId: req.userId } });
      if (result.count === 0) return res.status(404).json({ error: 'API key not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to revoke API key' });
    }
  });

  // ===== MONITORS (scheduled re-scans) =====

  app.get('/api/monitors', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const monitors = await prisma.monitor.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
      // Latest completed score per monitor, so the list can show a current value without N requests.
      const withScore = await Promise.all(monitors.map(async (m) => {
        const latest = await prisma.scan.findFirst({
          where: { monitorId: m.id, status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true, seoReport: true }
        });
        return { ...m, latestScore: (latest?.seoReport as any)?.score?.overall ?? null, latestScanId: latest?.id ?? null };
      }));
      res.json(withScore);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch monitors' });
    }
  });

  app.post('/api/monitors', authMiddleware, requireVerifiedEmail, validateBody(monitorCreateSchema), async (req: AuthRequest, res) => {
    try {
      const { url, frequency, alertDrop } = req.body;
      try {
        await assertPublicUrl(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      } catch (err) {
        if (err instanceof SsrfBlockedError) return res.status(400).json({ error: err.message });
        throw err;
      }
      if ((await prisma.monitor.count({ where: { userId: req.userId } })) >= 10) {
        return res.status(400).json({ error: 'You can have at most 10 monitors. Delete one first.' });
      }
      // nextRunAt defaults to now, so the first scheduler tick runs it immediately and the trend
      // line has a starting point.
      const monitor = await prisma.monitor.create({
        data: { url, frequency: frequency ?? 'WEEKLY', alertDrop: alertDrop ?? 5, userId: req.userId! }
      });
      res.status(201).json(monitor);
    } catch (err) {
      console.error('Monitor create error:', err);
      res.status(500).json({ error: 'Failed to create monitor' });
    }
  });

  app.patch('/api/monitors/:id', authMiddleware, validateBody(monitorUpdateSchema), async (req: AuthRequest, res) => {
    try {
      const existing = await prisma.monitor.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!existing) return res.status(404).json({ error: 'Monitor not found' });
      const { active, frequency, alertDrop } = req.body;
      const monitor = await prisma.monitor.update({
        where: { id: existing.id },
        data: {
          ...(active !== undefined && { active }),
          ...(alertDrop !== undefined && { alertDrop }),
          ...(frequency !== undefined && { frequency, nextRunAt: nextRunFrom(existing.lastRunAt ?? new Date(), frequency) })
        }
      });
      res.json(monitor);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update monitor' });
    }
  });

  app.delete('/api/monitors/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const result = await prisma.monitor.deleteMany({ where: { id: req.params.id, userId: req.userId } });
      if (result.count === 0) return res.status(404).json({ error: 'Monitor not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete monitor' });
    }
  });

  // Score history for the trend chart: oldest first.
  app.get('/api/monitors/:id/history', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const monitor = await prisma.monitor.findFirst({ where: { id: req.params.id, userId: req.userId } });
      if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
      const scans = await prisma.scan.findMany({
        where: { monitorId: monitor.id, status: 'COMPLETED' },
        orderBy: { createdAt: 'asc' },
        take: 200,
        select: { id: true, createdAt: true, seoReport: true, crawlData: true }
      });
      res.json(scans.map((sc) => {
        const score = (sc.seoReport as any)?.score ?? {};
        return {
          scanId: sc.id,
          at: sc.createdAt,
          overall: score.overall ?? null,
          technical: score.technical ?? null,
          content: score.content ?? null,
          aeoGeo: score.aeoGeo ?? null,
          performance: score.performance ?? null,
          criticalIssuesCount: (sc.seoReport as any)?.criticalIssues?.length ?? 0,
          simulated: (sc.crawlData as any)?.hasSimulatedData === true
        };
      }));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch monitor history' });
    }
  });

  // Public widget endpoint (no auth required for lead capture). optionalAuthMiddleware only
  // distinguishes "the signed-in owner testing their own embed" from "an anonymous visitor" for
  // rate-limiting purposes — the scan is still attributed via widgetKey, never via the token.
  app.post('/api/widget/scan', optionalAuthMiddleware, widgetScanLimiter, validateBody(widgetScanSchema), async (req, res) => {
    try {
      const { url, email, name, widgetKey } = req.body;

      // The widget key identifies which agency's account owns this lead —
      // without it, leads would silently attach to an arbitrary user (see AUTH_IMPLEMENTATION.md history).
      const user = await prisma.user.findUnique({ where: { widgetKey } });
      if (!user) {
        return res.status(404).json({ error: 'Invalid widget key. This embed is not linked to an active account.' });
      }
      if (verificationRequired() && !user.emailVerifiedAt) {
        return res.status(403).json({ error: 'This embed is not active yet: the account owner has not confirmed their email address.' });
      }

      // Refused before a scan record is created. This endpoint's URL is fetched
      // by a real browser on this server; a private address would turn it into
      // a proxy into the internal network.
      try {
        await assertPublicUrl(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      } catch (err) {
        if (err instanceof SsrfBlockedError) return res.status(400).json({ error: err.message });
        throw err;
      }

      const scan = await prisma.scan.create({
        data: {
          url,
          mode: 'SINGLE',
          depth: 1,
          status: 'PENDING',
          leadEmail: email,
          leadName: name,
          userId: user.id
        }
      });

      queueScan(scan.id, url, 'SINGLE', 1, user.id, { email, name });

      res.status(202).json({
        success: true,
        scanId: scan.id,
        message: 'Scan queued for processing'
      });
    } catch (err) {
      console.error('Widget scan error:', err);
      res.status(500).json({ error: 'Widget scan failed' });
    }
  });

  // Public widget status. The anonymous prospect who ran an embed scan has no auth token,
  // but the widget shows the score, the executive summary and a report link — all of which
  // only exist once the async scan finishes. Deliberately scoped to scans that carry a
  // leadEmail so this can never be used to read an owner-run audit, and scan ids are cuids,
  // so they are not enumerable.
  app.get('/api/widget/scan/:id', widgetStatusLimiter, async (req, res) => {
    try {
      const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });

      if (!scan || !scan.leadEmail) {
        return res.status(404).json({ error: 'Scan not found' });
      }

      const report = scan.seoReport as any;

      res.json({
        id: scan.id,
        url: scan.url,
        status: scan.status,
        score: report?.score?.overall ?? null,
        criticalIssuesCount: report?.criticalIssues?.length ?? 0,
        executiveSummary: report?.executiveSummary ?? null
      });
    } catch (err) {
      console.error('Widget status error:', err);
      res.status(500).json({ error: 'Failed to fetch widget scan status' });
    }
  });

  // Download report
  // Public widget leads (scans with a leadEmail) are downloadable without auth — the
  // anonymous prospect who ran the widget scan needs to fetch their own report.
  // Owner-run scans (no leadEmail) still require the owning user's auth token.
  app.get('/api/report/:id/download', reportLimiter, optionalAuthMiddleware, async (req: AuthRequest, res) => {
    try {
      const scan = await prisma.scan.findUnique({ where: { id: req.params.id } });

      if (!scan || scan.status !== 'COMPLETED' || !scan.seoReport) {
        return res.status(404).send('<h1>Report not available</h1>');
      }

      const isPublicLeadScan = !!scan.leadEmail;
      const isOwner = req.userId === scan.userId;
      if (!isPublicLeadScan && !isOwner) {
        return res.status(401).send('<h1>Not authorized to view this report</h1>');
      }

      const settings = await prisma.whiteLabelSettings.findUnique({
        where: { userId: scan.userId }
      });

      const reportHtml = generateReportHtml(scan as any, settings as any);
      const safeFilename = `seo_audit_${scan.url.replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (req.query.format === 'pdf') {
        const pdfBuffer = await renderHtmlToPdf(reportHtml);
        res.setHeader('Content-disposition', `attachment; filename=${safeFilename}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        res.send(pdfBuffer);
        return;
      }

      res.setHeader('Content-disposition', `attachment; filename=${safeFilename}.html`);
      res.setHeader('Content-type', 'text/html');
      res.send(reportHtml);
    } catch (err) {
      console.error('Report download error:', err);
      res.status(500).json({ error: 'Failed to download report' });
    }
  });

  // Unknown API routes answer JSON, not the SPA's HTML page.
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Last-resort error handler: malformed JSON is the caller's fault (400), everything else is
  // logged with its request and answered without leaking internals.
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' });
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function startServer() {
  validateEnv();

  // A stray rejection should be visible in the logs but must not take the server down; a truly
  // uncaught exception leaves the process in an unknown state, so log it and exit for a clean restart.
  process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
  process.on('uncaughtException', (err) => { console.error('[uncaughtException]', err); process.exit(1); });

  const app = createApp();

  // The scan queue is in memory: anything PENDING at boot was orphaned by the last shutdown.
  await recoverStuckScans();
  startScheduler();

  // ===== STATIC BUILD vs VITE DEV SERVER =====
  // `npm run dev` runs this file through tsx, hot-reloading via Vite middleware.
  // `npm start` runs the bundled server from dist/, which instead serves the
  // pre-built SPA. Detecting the bundle location means a stale dist/ folder can
  // never shadow the dev server, and no NODE_ENV juggling is needed on Windows.
  const runningFromBundle = /[/\\]dist[/\\]server\.(mjs|cjs|js)$/.test(new URL(import.meta.url).pathname);
  if (!runningFromBundle && process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Hashed assets are safe to cache forever, but index.html must never be cached.
    // A browser that loaded it while the Vite dev server was running holds an entry
    // pointing at /src/main.tsx; if that stale HTML is reused against this server the
    // module request returns HTML instead of JS and the app renders a blank page.
    const indexTemplate = loadIndexTemplate(distPath);
    const sendIndex = (req: express.Request, res: express.Response) => {
      res.setHeader('Cache-Control', 'no-store');
      res.type('html').send(renderIndex(indexTemplate, process.env.APP_URL || `http://localhost:${PORT}`, req.path));
    };
    // App shell responses (HTML, static files) get a CSP; the JSON API and report downloads do not.
    app.use((req, res, next) => {
      if (!req.path.startsWith('/api')) res.setHeader('Content-Security-Policy', contentSecurityPolicy(req.path));
      next();
    });
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store');
        } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', sendIndex);
  }

  // Bind without an explicit host so Node listens dual-stack (`::`, which also accepts
  // IPv4-mapped connections). The previous '0.0.0.0' bind was IPv4-only, and since
  // Windows resolves `localhost` to ::1 first, every fresh connection stalled ~2s
  // waiting for the IPv6 attempt to fail before falling back to 127.0.0.1.
  const server = app.listen(PORT, () => {
    console.log(`SEO Scan Pro v1.1 running at http://localhost:${PORT}`);
  });

  // Railway sends SIGTERM on every redeploy and gives ~10s. Stop taking traffic and new monitor
  // runs, then release Chromium and the database so nothing is left half-written or orphaned.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received — shutting down.`);
    stopScheduler();
    const force = setTimeout(() => process.exit(1), 8000);
    force.unref();
    server.close(async () => {
      await closeBrowser().catch(() => {});
      await prisma.$disconnect().catch(() => {});
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Report HTML generator
// Everything interpolated into the report is escaped. Much of it is not ours:
// scan.url is user input, and the executive summary is LLM output written after
// reading the SCANNED site — a hostile site can steer that into markup. This
// HTML is rendered by the server's own headless browser for PDF export, so
// unescaped markup there is not only a broken report, it is a way to make the
// server fetch things (lib/pdf.ts also blocks private addresses as a second layer).
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// primaryColor lands inside a style="" attribute, where escaping alone still
// leaves CSS injection (url(...), expression breaking out of the declaration).
// Only an actual colour value is allowed through.
function safeColor(value: unknown, fallback = '#0ea5e9'): string {
  const v = String(value ?? '').trim();
  return /^#[0-9a-f]{3,8}$/i.test(v) || /^[a-z]{3,20}$/i.test(v) ? v : fallback;
}

// Scores arrive in LLM-generated JSON; nothing guarantees they are numbers.
function safeScore(value: unknown): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function generateReportHtml(scan: any, settings: any): string {
  const isEs = settings?.language === 'es';
  const customTitle = isEs ? 'Auditoría SEO Profesional' : 'Professional SEO Audit';

  // The same hand-off prompt the dashboard offers. Prefers the one DeepSeek wrote for this
  // audit and falls back to the deterministic builder for scans that predate the field.
  const agentPrompt = scan.seoReport?.agentReadyPrompt?.prompt
    ? scan.seoReport.agentReadyPrompt
    : buildAgentReadyPrompt({
        url: scan.url,
        score: scan.seoReport?.score ?? { overall: 0, technical: 0, content: 0, aeoGeo: 0, performance: 0 },
        criticalIssues: scan.seoReport?.criticalIssues ?? [],
        recommendedFixes: scan.seoReport?.recommendedFixes ?? [],
        aeoAssessment: scan.seoReport?.aeoAssessment,
        executiveSummary: scan.seoReport?.executiveSummary,
        isSimulated: scan.crawlData?.hasSimulatedData === true
      });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${customTitle} - ${escapeHtml(scan.url)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    @media print {
      .no-print { display: none !important; }
      body { background: white; color: black; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 p-6 md:p-12">
  <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12">
    ${scan.crawlData?.hasSimulatedData ? `
    <div class="mb-8 p-5 rounded-2xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
      <span class="text-red-500 font-bold text-lg leading-none">&#9888;</span>
      <div>
        <h3 class="font-extrabold text-red-800 text-sm uppercase tracking-wide">${isEs ? 'Datos Simulados — No es una Auditoría Real' : 'Simulated Data — Not a Real Audit'}</h3>
        <p class="text-xs text-red-700 mt-1 leading-relaxed">${isEs
          ? 'No se pudo acceder al sitio de destino durante este escaneo. Los datos a continuación son marcadores de posición ilustrativos, no un análisis real.'
          : 'The target site could not be reached during this scan. The data below is an illustrative placeholder, not a real analysis of the site.'}</p>
      </div>
    </div>
    ` : ''}
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-8 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight" style="color: ${safeColor(settings?.primaryColor)}">${escapeHtml(settings?.agencyName || 'SEO Scan Pro')}</h1>
        <p class="text-slate-500 font-medium text-sm mt-1">${customTitle}</p>
      </div>
      <div class="mt-4 md:mt-0 text-left md:text-right">
        <p class="text-xs text-slate-400">Target URL</p>
        <p class="font-bold text-lg text-slate-800 break-all">${escapeHtml(scan.url)}</p>
        <p class="text-xs text-slate-400 mt-2">Audit Date</p>
        <p class="text-sm font-semibold text-slate-600">${new Date(scan.createdAt).toLocaleDateString()}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Overall</span>
        <div class="text-4xl font-extrabold mt-2" style="color: ${safeColor(settings?.primaryColor)}">${safeScore(scan.seoReport?.score?.overall)}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Technical</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${safeScore(scan.seoReport?.score?.technical)}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Content</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${safeScore(scan.seoReport?.score?.content)}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">AEO & AI</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${safeScore(scan.seoReport?.score?.aeoGeo)}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Performance</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${safeScore(scan.seoReport?.score?.performance)}/100</div>
      </div>
    </div>

    <div class="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
      <h2 class="text-xl font-bold mb-3" style="color: ${safeColor(settings?.primaryColor)}">Executive Summary</h2>
      <p class="text-slate-600 leading-relaxed text-sm">${escapeHtml(scan.seoReport?.executiveSummary || 'N/A')}</p>
    </div>

    <div class="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-700">
      <h2 class="text-lg font-bold mb-1 text-emerald-400">${isEs ? 'Prompt Listo para Agente' : 'Agent-Ready Prompt'}</h2>
      <p class="text-xs text-slate-400 mb-4">${isEs
        ? 'Pega este bloque en tu agente de código (Claude Code, Cursor, Copilot) para implementar las correcciones.'
        : 'Paste this block into your coding agent (Claude Code, Cursor, Copilot) to implement the fixes below.'}</p>
      <pre class="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words font-mono">${escapeHtml(agentPrompt.prompt)}</pre>
    </div>

    <div class="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
      <p>${escapeHtml(settings?.customFooter || 'Report provided by SEO Scan Pro')}</p>
      <button class="no-print mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-sm shadow inline-block transition cursor-pointer" onclick="window.print()">
        Print Report / Save to PDF
      </button>
    </div>
  </div>
</body>
</html>
  `;
}

// Only auto-boot when this file is run directly (e.g. `tsx server.ts`), not when
// `createApp` is imported elsewhere — such as from the test suite via supertest.
// pathToFileURL handles platform differences correctly (Windows needs `file:///C:/...`,
// which a hand-rolled `file://` + path string gets wrong by one slash).
const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
