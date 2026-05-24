import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { crawlUrl } from './lib/crawler';
import { generateSeoReport } from './lib/deepseek';
import { Scan, WhiteLabelSettings } from './src/types';

// Establish relative folder context
const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize local persistent Database with gorgeous presets
const defaultSettings: WhiteLabelSettings = {
  agencyName: 'SEO Scan Elite',
  primaryColor: '#0ea5e9', // Deep sky blue
  accentColor: '#1e40af',  // Royal accent blue
  customFooter: 'Report provided by SEO Scan Pro • Powered by DeepSeek V4.',
  enabledSections: ['executive', 'technical', 'content', 'aeo-geo', 'checklist'],
  language: 'en'
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = { scans: [] as Scan[], settings: defaultSettings };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading db.json, returning empty memory store', err);
    return { scans: [] as Scan[], settings: defaultSettings };
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed writing to db.json', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount JSON parser body helpers
  app.use(express.json());

  // API ENDPOINTS FIRST

  // 1. Health Ping
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // 2. Scan Settings
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    res.json(db.settings || defaultSettings);
  });

  app.post('/api/settings', (req, res) => {
    const db = readDb();
    const cleanSettings: WhiteLabelSettings = {
      agencyName: req.body.agencyName || defaultSettings.agencyName,
      logoUrl: req.body.logoUrl || '',
      primaryColor: req.body.primaryColor || defaultSettings.primaryColor,
      accentColor: req.body.accentColor || defaultSettings.accentColor,
      customFooter: req.body.customFooter || defaultSettings.customFooter,
      enabledSections: Array.isArray(req.body.enabledSections) ? req.body.enabledSections : defaultSettings.enabledSections,
      language: req.body.language === 'es' ? 'es' : 'en',
      webhookUrl: req.body.webhookUrl || '',
      monitoringEmail: req.body.monitoringEmail || '',
      enableEmailAlerts: !!req.body.enableEmailAlerts
    };
    db.settings = cleanSettings;
    writeDb(db);
    res.json({ success: true, settings: cleanSettings });
  });

  // 3. Lists Search Scans
  app.get('/api/scans', (req, res) => {
    const db = readDb();
    // Sort chronological descending
    const sorted = [...db.scans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted);
  });

  // 4. GET individual audit
  app.get('/api/scans/:id', (req, res) => {
    const db = readDb();
    const audit = db.scans.find((s: Scan) => s.id === req.params.id);
    if (!audit) {
      return res.status(404).json({ error: 'Audit profile not found' });
    }
    res.json(audit);
  });

  // 5. POST Action: Run new scan
  app.post('/api/scan', async (req, res) => {
    const { url, mode, depth, leadInfo } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Target scanning URL is required' });
    }

    const db = readDb();
    const scanId = 'scan_' + Math.random().toString(36).substr(2, 9);
    
    // Find previous scan of this URL for comparative chronological graphing
    const formattedTarget = url.toLowerCase().trim().replace(/https?:\/\//, '');
    const previous = db.scans.find((s: Scan) => 
      s.status === 'COMPLETED' && 
      s.url.toLowerCase().trim().replace(/https?:\/\//, '') === formattedTarget
    );

    const newScan: Scan = {
      id: scanId,
      url,
      mode: mode === 'FULL_SITE' ? 'FULL_SITE' : 'SINGLE',
      depth: parseInt(depth) || 1,
      status: 'PENDING',
      leadInfo,
      previousReportId: previous ? previous.id : undefined,
      createdAt: new Date().toISOString()
    };

    // Store pending status so it has visual list response immediately
    db.scans.push(newScan);
    writeDb(db);

    // Run active scan asynchronously or resolve as blocked to avoid server timeout bottlenecks
    try {
      console.log(`Starting crawl process for URL: ${url} (Mode: ${mode})`);
      const crawlRes = await crawlUrl(url, newScan.mode, newScan.depth);
      console.log(`Crawl completed. Resolving deep intelligence with Gemini API...`);
      const seoReport = await generateSeoReport(crawlRes);

      // Reload database to prevent race overrides
      const dbReload = readDb();
      const targetScan = dbReload.scans.find((s: Scan) => s.id === scanId);
      if (targetScan) {
        targetScan.status = 'COMPLETED';
        targetScan.crawlResult = crawlRes;
        targetScan.seoReport = seoReport;
        writeDb(dbReload);
        res.json(targetScan);
      } else {
        res.status(500).json({ error: 'Scan profile lost during calculation write-back.' });
      }
    } catch (err: any) {
      console.error(`Core audit pipeline collapsed for url: ${url}`, err);
      const dbReload = readDb();
      const targetScan = dbReload.scans.find((s: Scan) => s.id === scanId);
      if (targetScan) {
        targetScan.status = 'FAILED';
        writeDb(dbReload);
      }
      res.status(500).json({ error: err?.message || 'Calculation engine failure' });
    }
  });

  // 6. Lead Magnet public script widget endpoint
  app.post('/api/widget/scan', async (req, res) => {
    const { url, email, name, agencyId } = req.body;
    if (!url || !email) {
      return res.status(400).json({ error: 'Missing required parameters [url, email] for widget inquiry.' });
    }

    const db = readDb();
    const scanId = 'lead_' + Math.random().toString(36).substr(2, 9);

    const newScan: Scan = {
      id: scanId,
      url,
      mode: 'SINGLE',
      depth: 1,
      status: 'PENDING',
      leadInfo: { email, name, agencyId },
      createdAt: new Date().toISOString()
    };

    db.scans.push(newScan);
    writeDb(db);

    try {
      const crawlRes = await crawlUrl(url, 'SINGLE', 1);
      const seoReport = await generateSeoReport(crawlRes);

      const dbReload = readDb();
      const targetScan = dbReload.scans.find((s: Scan) => s.id === scanId);
      const activeSettings = dbReload.settings || defaultSettings;

      if (targetScan) {
        targetScan.status = 'COMPLETED';
        targetScan.crawlResult = crawlRes;
        targetScan.seoReport = seoReport;
        writeDb(dbReload);

        // Async Webhook pipeline integration (no-blocking failure path)
        if (activeSettings.webhookUrl) {
          fetch(activeSettings.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'seo_lead_captured',
              timestamp: new Date().toISOString(),
              agencyName: activeSettings.agencyName,
              scanId,
              targetUrl: url,
              leadName: name,
              leadEmail: email,
              overallScore: seoReport.score.overall,
              criticalIssuesCount: seoReport.criticalIssues.length
            })
          }).catch(webhookErr => {
            console.error('Agency lead magnet webhook failed to respond:', webhookErr);
          });
        }

        res.json({ 
          success: true, 
          scanId,
          score: seoReport.score.overall,
          criticalIssuesCount: seoReport.criticalIssues.length,
          executiveSummary: seoReport.executiveSummary,
          report: seoReport
        });
      }
    } catch (err: any) {
      const dbReload = readDb();
      const targetScan = dbReload.scans.find((s: Scan) => s.id === scanId);
      if (targetScan) {
        targetScan.status = 'FAILED';
        writeDb(dbReload);
      }
      res.status(500).json({ error: 'Widget audit engine halted temporarily.' });
    }
  });

  // 7. GET: Download White-Label standalone HTML report
  app.get('/api/report/:id/download', (req, res) => {
    const db = readDb();
    const scan = db.scans.find((s: Scan) => s.id === req.params.id);
    if (!scan || scan.status !== 'COMPLETED') {
      return res.status(404).send('<h1>No audited report available for download yet</h1>');
    }

    const set = db.settings || defaultSettings;
    const isEs = set.language === 'es';

    // Build a neat standalone, single-file HTML wrapper containing fully compiled audits
    // This allows downloading an elegant offline version representing the white-label branding flawlessly!
    const customTitle = isEs ? 'Auditoría SEO Profesional' : 'Professional SEO Audit';
    const reportHtml = `
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
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 p-6 md:p-12">
  <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-8 md:p-12 relative">
    
    <!-- HEADER BAR -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-8 mb-8">
      <div>
        ${set.logoUrl ? `<img src="${set.logoUrl}" alt="Logo" class="h-12 mb-4 object-contain">` : ''}
        <h1 class="text-3xl font-extrabold tracking-tight" style="color: ${set.primaryColor}">${set.agencyName || 'SEO Analytics'}</h1>
        <p class="text-slate-500 font-medium text-sm mt-1">${customTitle}</p>
      </div>
      <div class="mt-4 md:mt-0 text-left md:text-right">
        <p class="text-xs text-slate-400">Target URL</p>
        <p class="font-bold text-lg text-slate-800 break-all">${scan.url}</p>
        <p class="text-xs text-slate-400 mt-2">Audit Date</p>
        <p class="text-sm font-semibold text-slate-600">${new Date(scan.createdAt).toLocaleDateString()}</p>
      </div>
    </div>

    <!-- MAIN SCORES -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Overall</span>
        <div class="text-4xl font-extrabold mt-2" style="color: ${set.primaryColor}">${scan.seoReport?.score.overall}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Technical</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score.technical}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Content</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score.content}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">AEO & AI</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score.aeoGeo}/100</div>
      </div>
      <div class="bg-slate-50 p-4 rounded-xl text-center border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
        <span class="text-xs text-slate-400 uppercase font-bold tracking-wider">Performance</span>
        <div class="text-2xl font-bold mt-2 text-slate-700">${scan.seoReport?.score.performance}/100</div>
      </div>
    </div>

    <!-- EXECUTIVE ANALYSIS -->
    <div class="mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
      <h2 class="text-xl font-bold mb-3 flex items-center" style="color: ${set.primaryColor}">
        Executive Summary
      </h2>
      <p class="text-slate-600 leading-relaxed text-sm">${scan.seoReport?.executiveSummary}</p>
    </div>

    <!-- CRITICAL WARNINGS -->
    <div class="mb-8">
      <h2 class="text-lg font-bold text-red-700 mb-4 border-b border-red-100 pb-2">Critical Red Flags</h2>
      <ul class="space-y-2">
        ${scan.seoReport?.criticalIssues.map(issue => `
          <li class="flex items-start bg-red-50 text-red-800 p-3 rounded-lg text-sm border-l-4 border-red-600">
            <span class="mr-2 font-bold select-none">•</span>
            <span>${issue}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <!-- DETAILED AUDIT SPEC -->
    <div class="mb-8">
      <h2 class="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Specific Action Items</h2>
      <div class="space-y-4">
        ${scan.seoReport?.recommendedFixes.map(fix => `
          <div class="border border-slate-100 rounded-xl p-5 hover:bg-slate-50 bg-white shadow-sm transition">
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                fix.priority === 'high' ? 'bg-red-100 text-red-700' : 
                fix.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }">${fix.priority} priority</span>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold uppercase">${fix.category}</span>
            </div>
            <h3 class="font-bold text-slate-800 text-sm mb-1">${fix.title}</h3>
            <p class="text-xs text-slate-500 mb-2">${fix.description}</p>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
              <div class="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Development Specs</div>
              <p class="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-line">${fix.remediation}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- AEO ASSESSMENT -->
    <div class="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
      <h2 class="text-lg font-bold mb-4 text-slate-800">Generative Engine Optimization (GEO/AEO)</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span class="text-xs text-slate-400">AI Trust Score</span>
          <div class="text-2xl font-bold" style="color: ${set.accentColor}">${scan.seoReport?.aeoAssessment.generativeFriendlinessScore}/100</div>
          <p class="text-xs text-slate-500 mt-2">${scan.seoReport?.aeoAssessment.directAnswerFriendliness}</p>
        </div>
        <div>
          <span class="text-xs text-slate-400">AI Target Recommendations</span>
          <ul class="space-y-1.5 mt-2">
            ${scan.seoReport?.aeoAssessment.recommendationsForAeo.map(rec => `
              <li class="text-xs text-slate-600 flex items-start">
                <span class="mr-1.5 text-blue-500 font-bold">•</span>
                <span>${rec}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>

    <!-- TECH METRICS SUMMARY -->
    <div class="mb-12">
      <h2 class="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Technical Crawl Statistics</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <div class="text-xs text-slate-400 font-medium">Load Delay</div>
          <div class="text-xl font-bold text-slate-700 mt-1">${scan.crawlResult?.mainPage?.loadTimeMs || 0} ms</div>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <div class="text-xs text-slate-400 font-medium">Page Weight</div>
          <div class="text-xl font-bold text-slate-700 mt-1">${scan.crawlResult?.mainPage?.pageSizeKb || 0} KB</div>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <div class="text-xs text-slate-400 font-medium font-medium">Image Count (No Alt)</div>
          <div class="text-xl font-bold text-red-700 mt-1">${scan.crawlResult?.mainPage?.images?.total || 0} (${scan.crawlResult?.mainPage?.images?.missingAlt || 0})</div>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <div class="text-xs text-slate-400 font-medium">Sitemap Status</div>
          <div class="text-xl font-bold mt-1 ${scan.crawlResult?.sitemapFound ? 'text-emerald-700' : 'text-red-700'}">
            ${scan.crawlResult?.sitemapFound ? 'Found' : 'Missing'}
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
      <p>${set.customFooter}</p>
      <button class="no-print mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-lg text-sm shadow inline-flex items-center space-x-2 transition cursor-pointer" onclick="window.print()">
        <span>Print Report / Save to PDF</span>
      </button>
    </div>

  </div>
</body>
</html>
    `;

    res.setHeader('Content-disposition', `attachment; filename=seo_audit_${scan.url.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
    res.setHeader('Content-type', 'text/html');
    res.send(reportHtml);
  });

  // VITE DEV / PRODUCTION INGRESS HANDLERS
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset serving
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

startServer();
