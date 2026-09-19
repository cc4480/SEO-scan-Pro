import 'dotenv/config';
import express from 'express';
import path from 'path';
import { pathToFileURL } from 'url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { crawlUrl } from './lib/crawler';
import { generateSeoReport } from './lib/deepseek';
import { prisma } from './lib/db';
import { hashPassword, verifyPassword, generateToken } from './lib/auth';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from './lib/authMiddleware';
import { validateBody, registerSchema, loginSchema, scanCreateSchema, widgetScanSchema, settingsSchema } from './lib/validation';
import { validateEnv } from './lib/env';
import { Scan, WhiteLabelSettings } from './src/types';

// In test runs, the integration suite makes far more than 10 auth calls across many
// independent test cases against the same shared limiter instance — a low production
// limit here would make the suite flaky/order-dependent rather than actually testing anything.
// Rate-limiting behavior itself is covered separately by a dedicated unit test with its own limiter.
const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

const widgetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isTestEnv ? 100000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests from this device. Please try again later.' }
});

export function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false // report HTML pages inject inline Tailwind/scripts; CSP handled at report level separately
  }));
  app.use(express.json());
  app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true
  }));

  // ===== AUTHENTICATION ENDPOINTS =====

  // Register endpoint
  app.post('/api/auth/register', authLimiter, validateBody(registerSchema), async (req, res) => {
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
              agencyName: 'SEO Scan Elite',
              primaryColor: '#0ea5e9',
              accentColor: '#1e40af',
              customFooter: 'Report provided by SEO Scan Pro • Powered by DeepSeek V4.',
              enabledSections: ['executive', 'technical', 'content', 'aeo-geo', 'checklist'],
              language: 'en'
            }
          }
        }
      });

      const token = generateToken(user.id);
      res.status(201).json({
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

      const token = generateToken(user.id);
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user' });
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

  // Get all scans for user
  app.get('/api/scans', authMiddleware, async (req: AuthRequest, res) => {
    try {
      // Capped + paginated to avoid an unbounded query as scan history grows.
      // Response stays a plain array for backward compatibility; total count comes back
      // via the X-Total-Count header for callers that want to build real pagination UI.
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

      const [scans, total] = await Promise.all([
        prisma.scan.findMany({
          where: { userId: req.userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.scan.count({ where: { userId: req.userId } })
      ]);

      res.setHeader('X-Total-Count', total.toString());
      res.json(scans);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch scans' });
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

  // Create new scan
  app.post('/api/scan', authMiddleware, validateBody(scanCreateSchema), async (req: AuthRequest, res) => {
    try {
      const { url, mode, depth, leadEmail, leadName } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
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

      // Start scan asynchronously
      scanAsync(newScan.id, url, newScan.mode as 'SINGLE' | 'FULL_SITE', newScan.depth, req.userId);

      res.status(202).json(newScan);
    } catch (err: any) {
      console.error('Scan creation error:', err);
      res.status(500).json({ error: 'Failed to create scan' });
    }
  });

  // Public widget endpoint (no auth required for lead capture)
  app.post('/api/widget/scan', widgetLimiter, validateBody(widgetScanSchema), async (req, res) => {
    try {
      const { url, email, name, widgetKey } = req.body;

      // The widget key identifies which agency's account owns this lead —
      // without it, leads would silently attach to an arbitrary user (see AUTH_IMPLEMENTATION.md history).
      const user = await prisma.user.findUnique({ where: { widgetKey } });
      if (!user) {
        return res.status(404).json({ error: 'Invalid widget key. This embed is not linked to an active account.' });
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

      scanAsync(scan.id, url, 'SINGLE', 1, user.id);

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

  // Download report
  // Public widget leads (scans with a leadEmail) are downloadable without auth — the
  // anonymous prospect who ran the widget scan needs to fetch their own report.
  // Owner-run scans (no leadEmail) still require the owning user's auth token.
  app.get('/api/report/:id/download', optionalAuthMiddleware, async (req: AuthRequest, res) => {
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
      res.setHeader('Content-disposition', `attachment; filename=seo_audit_${scan.url.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
      res.setHeader('Content-type', 'text/html');
      res.send(reportHtml);
    } catch (err) {
      console.error('Report download error:', err);
      res.status(500).json({ error: 'Failed to download report' });
    }
  });

  return app;
}

async function startServer() {
  validateEnv();

  const app = createApp();
  const PORT = 3000;

  // ===== VITE DEV SERVER SETUP =====
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEO Scan Pro v1.1 full-stack gateway hosted beautifully on port ${PORT}`);
  });
}

// Async scan processor
// Runs fire-and-forget (not awaited by the route handler), so the scan row can be deleted
// out from under it mid-flight (user deletes the scan, or their account, while this is still
// running). Both updates below use updateMany, which is a no-op on zero matched rows instead
// of throwing P2025 — a plain update() here would produce an unhandled rejection in that case.
async function scanAsync(scanId: string, url: string, mode: 'SINGLE' | 'FULL_SITE', depth: number, userId: string) {
  try {
    console.log(`Starting scan ${scanId} for URL: ${url}`);
    const crawlRes = await crawlUrl(url, mode, depth);
    const seoReport = await generateSeoReport(crawlRes);

    await prisma.scan.updateMany({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        crawlData: crawlRes as any,
        seoReport: seoReport as any
      }
    });

    console.log(`Scan ${scanId} completed successfully`);
  } catch (err: any) {
    console.error(`Scan ${scanId} failed:`, err);
    await prisma.scan.updateMany({
      where: { id: scanId },
      data: { status: 'FAILED' }
    });
  }
}

// Report HTML generator
function generateReportHtml(scan: any, settings: any): string {
  const isEs = settings?.language === 'es';
  const customTitle = isEs ? 'Auditoría SEO Profesional' : 'Professional SEO Audit';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${customTitle} - ${scan.url}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
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
        <h1 class="text-3xl font-extrabold tracking-tight" style="color: ${settings?.primaryColor || '#0ea5e9'}">${settings?.agencyName || 'SEO Scan Pro'}</h1>
        <p class="text-slate-500 font-medium text-sm mt-1">${customTitle}</p>
      </div>
      <div class="mt-4 md:mt-0 text-left md:text-right">
        <p class="text-xs text-slate-400">Target URL</p>
        <p class="font-bold text-lg text-slate-800 break-all">${scan.url}</p>
        <p class="text-xs text-slate-400 mt-2">Audit Date</p>
        <p class="text-sm font-semibold text-slate-600">${new Date(scan.createdAt).toLocaleDateString()}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Overall</span>
        <div class="text-4xl font-extrabold mt-2" style="color: ${settings?.primaryColor || '#0ea5e9'}">${scan.seoReport?.score?.overall || 0}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Technical</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score?.technical || 0}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Content</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score?.content || 0}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">AEO & AI</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score?.aeoGeo || 0}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold">Performance</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score?.performance || 0}/100</div>
      </div>
    </div>

    <div class="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
      <h2 class="text-xl font-bold mb-3" style="color: ${settings?.primaryColor || '#0ea5e9'}">Executive Summary</h2>
      <p class="text-slate-600 leading-relaxed text-sm">${scan.seoReport?.executiveSummary || 'N/A'}</p>
    </div>

    <div class="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
      <p>${settings?.customFooter || 'Report provided by SEO Scan Pro'}</p>
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
