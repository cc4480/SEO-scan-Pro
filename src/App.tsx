import { notify } from './ui/notify';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Scan, WhiteLabelSettings, ProgressEvent } from './types';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import ReportComparison from './components/ReportComparison';
import WhiteLabelEditor from './components/WhiteLabelEditor';
import WidgetEmbedBuilder from './components/WidgetEmbedBuilder';
import EmbedView from './components/EmbedView';
import CompetitorBenchmark from './components/CompetitorBenchmark';
import ErrorBoundary from './components/ErrorBoundary';
import VerifyEmailBanner from './components/VerifyEmailBanner';
import ScanRunningPanel from './components/ScanRunningPanel';
import AnimatedNumber from './ui/AnimatedNumber';
import LegalPage from './legal/LegalPage';
// The landing page carries the animation libraries; signed-in users never download them.
const Landing = lazy(() => import('./landing/Landing'));

import { motion } from 'motion/react';
import { EMAIL_VERIFIED_EVENT } from './components/VerifyLinkNotice';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ForgotPasswordForm from './components/Auth/ForgotPasswordForm';
import ResetPasswordForm from './components/Auth/ResetPasswordForm';
import AccountSettings from './components/AccountSettings';
import MonitorsPanel from './components/MonitorsPanel';
import LeadsPanel from './components/LeadsPanel';
import { downloadWithAuth } from './download';
import {
  Globe, Sliders, Palette, Code, History, TrendingUp, Sparkles,
  RefreshCw, CheckCircle2, ShieldAlert, Award, FileSearch, HelpCircle, LogOut, Trash2, UserCog, Activity, Users, Download, Search
} from 'lucide-react';

export default function App() {
  const isEmbedPage = typeof window !== 'undefined' && window.location.pathname === '/embed';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Signed-out visitors land on the marketing page; /login and /signup, and any emailed link, go straight to the forms.
  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [showLanding, setShowLanding] = useState(initialPath === '/' && !initialParams.get('resetToken') && !initialParams.get('verifyToken'));
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialPath === '/signup' ? 'register' : 'login');
  const [resetToken, setResetToken] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string; widgetKey: string; emailVerified?: boolean } | null>(null);

  // ---- Hooks -----------------------------------------------------------------------
  // EVERY hook must run on every render, before any early return below. Eight useState
  // calls and the loadDatabase effect previously sat *after* the auth guards, so an
  // already-authenticated visit called far more hooks than the login render had —
  // React error #310 ("rendered more hooks than during the previous render") — which
  // blanked the page for anyone with a token in localStorage instead of showing the
  // dashboard. Keep all hooks above the early returns.
  const [scans, setScans] = useState<Scan[]>([]);
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    agencyName: 'SEO Scan Pro',
    primaryColor: '#0ea5e9',
    accentColor: '#1e40af',
    customFooter: 'Report provided by SEO Scan Pro • Powered by DeepSeek V4.',
    enabledSections: ['executive', 'technical', 'content', 'aeo-geo', 'checklist'],
    language: 'en'
  });
  const [activeTab, setActiveTab] = useState<'audit' | 'compare' | 'monitoring' | 'leads' | 'settings' | 'widget' | 'benchmark' | 'account'>('audit');
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [selectedCompareScan, setSelectedCompareScan] = useState<Scan | undefined>(undefined);
  const [isCrawlLoading, setIsCrawlLoading] = useState(false);
  const [scanningUrl, setScanningUrl] = useState('');
  // Real log lines streamed from the server while a scan runs (see /api/scans/:id/events).
  const [auditEvents, setAuditEvents] = useState<ProgressEvent[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  // History list filters. `historyQuery` is the debounced value actually sent to the server.
  const [searchText, setSearchText] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'COMPLETED' | 'PENDING' | 'FAILED'>('');
  const [leadsOnly, setLeadsOnly] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // Loads /api/auth/me (incl. widgetKey) using whatever token is in localStorage
  const loadCurrentUser = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        return true;
      }
      localStorage.removeItem('token');
      return false;
    } catch {
      localStorage.removeItem('token');
      return false;
    }
  };

  // Load Database stats on bootstrap
  const buildScanFilterQuery = () => {
    const params = new URLSearchParams();
    if (historyQuery) params.set('q', historyQuery);
    if (statusFilter) params.set('status', statusFilter);
    if (leadsOnly) params.set('leads', 'true');
    return params.toString();
  };

  const loadDatabase = async () => {
    try {
      const filterQuery = buildScanFilterQuery();
      const scansRes = await fetch(`/api/scans${filterQuery ? `?${filterQuery}` : ''}`, {
        headers: getAuthHeaders()
      });
      if (scansRes.ok) {
        const scansData = await scansRes.json();
        setScans(scansData);
        if (scansData.length > 0) {
          // Default pre-open the latest completed scan. The updater form avoids closing over a
          // stale `activeScan` (this function is recreated per render), which previously left the
          // right-hand pane empty after the active scan was deleted.
          const completed = scansData.find((s: Scan) => s.status === 'COMPLETED');
          if (completed) setActiveScan(prev => prev ?? completed);
        }
      }

      const settingsRes = await fetch('/api/settings', {
        headers: getAuthHeaders()
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error('Failed querying backend express endpoints', err);
    }
  };

  // A password-reset link lands on the root path with ?resetToken=... — jump straight
  // into the reset form rather than showing the normal login screen.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('resetToken');
    if (token) {
      setResetToken(token);
      setAuthMode('reset');
      // Clean the token out of the visible URL/history without a full navigation.
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // VerifyLinkNotice fires this after a confirmation link succeeds, so the banner clears without a reload.
  useEffect(() => {
    const refresh = () => { loadCurrentUser(); };
    window.addEventListener(EMAIL_VERIFIED_EVENT, refresh);
    return () => window.removeEventListener(EMAIL_VERIFIED_EVENT, refresh);
  }, []);

  // Browser back/forward between the landing page and the auth forms.
  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname;
      setShowLanding(p === '/');
      if (p === '/signup') setAuthMode('register');
      else if (p === '/login' || p === '/') setAuthMode('login');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Check authentication on mount
  useEffect(() => {
    loadCurrentUser()
      .then(ok => setIsAuthenticated(ok))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Debounce the search box so a request is not sent per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setHistoryQuery(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Fetch scan history + branding once the user is signed in, and refetch when a filter changes.
  useEffect(() => {
    if (isAuthenticated) loadDatabase();
  }, [isAuthenticated, historyQuery, statusFilter, leadsOnly]);

  // Bring the report into view whenever one is rendered. A scan takes ~30s, by which point the
  // user has usually scrolled down to the launch button or the history list — so the audit they
  // just waited for would render above the fold, off-screen. Also covers opening a different
  // scan from the history list.
  useEffect(() => {
    if (!activeScan) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeScan?.id]);

  // ---- Early returns: safe now that every hook above runs on every render. ----
  if (isEmbedPage) {
    return <EmbedView />;
  }

  // Terms and Privacy are public pages on real URLs, reachable signed in or out.
  const pathname = window.location.pathname;
  const legalKind = pathname === '/terms' || pathname === '/terms/' ? 'terms' : pathname === '/privacy' || pathname === '/privacy/' ? 'privacy' : null;
  if (legalKind) return <LegalPage kind={legalKind} />;

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-sm">Loading application...</p>
        </div>
      </div>
    );
  }

  // Show landing, or login/register/forgot/reset, if not authenticated
  if (!isAuthenticated) {
    const openAuth = (mode: 'login' | 'register') => {
      setAuthMode(mode);
      setShowLanding(false);
      window.history.pushState({}, '', mode === 'register' ? '/signup' : '/login');
      window.scrollTo(0, 0);
    };
    if (showLanding && authMode === 'login') {
      return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <Landing onGetStarted={() => openAuth('register')} onSignIn={() => openAuth('login')} />
        </Suspense>
      );
    }
    const backToHome = () => {
      setShowLanding(true);
      setAuthMode('login');
      window.history.pushState({}, '', '/');
    };
    if (authMode === 'forgot') {
      return <ForgotPasswordForm onSwitchToLogin={() => setAuthMode('login')} />;
    }
    if (authMode === 'reset') {
      return (
        <ResetPasswordForm
          token={resetToken}
          onResetSuccess={() => {
            setResetToken('');
            setAuthMode('login');
          }}
        />
      );
    }
    return (
      <>
        <button
          type="button" onClick={backToHome}
          className="fixed left-4 top-4 z-50 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
        >
          &larr; Home
        </button>
        {authMode === 'login' ? (
          <LoginForm
            onLoginSuccess={() => loadCurrentUser().then(() => setIsAuthenticated(true))}
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToForgotPassword={() => setAuthMode('forgot')}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={() => loadCurrentUser().then(() => setIsAuthenticated(true))}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </>
    );
  }

  // Polls until the audit actually finishes. POST /api/scan answers 202 immediately and the
  // crawl + DeepSeek analysis then run asynchronously on the server, so without this the UI
  // showed a PENDING scan forever and the audit looked like it had silently failed.
  const waitForScan = async (scanId: string, timeoutMs = 300000): Promise<Scan | null> => {
    const deadline = Date.now() + timeoutMs;
    let seen = 0;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 700));
      try {
        // The events endpoint returns each new log line once (?after=<lines already shown>) and
        // the scan's status, so one cheap request drives both the live log and completion.
        const res = await fetch(`/api/scans/${scanId}/events?after=${seen}`, { headers: getAuthHeaders() });
        // Logged out, or the scan was deleted while we were waiting: stop polling rather than
        // hammering a 401 for five minutes and then alerting over the login screen.
        if (res.status === 401 || res.status === 403 || res.status === 404) return null;
        if (!res.ok) continue;
        const data: { status: string; events: ProgressEvent[]; next: number } = await res.json();
        if (data.events.length > 0) {
          seen = data.next;
          setAuditEvents(prev => [...prev, ...data.events]);
        }
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          const full = await fetch(`/api/scans/${scanId}`, { headers: getAuthHeaders() });
          if (full.ok) return (await full.json()) as Scan;
        }
      } catch {
        // Transient blip — keep polling until the deadline.
      }
    }
    return null;
  };

  // Run dynamic scanning triggers
  const executeScan = async (payload: { url: string; mode: any; depth: number; leadEmail?: string; leadName?: string }) => {
    setIsCrawlLoading(true);
    setScanningUrl(payload.url);
    // The live log is fed by real events from the scanner (waitForScan below), not a timer.
    setAuditEvents([]);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Pipeline calculation failure');
      }

      // This is the freshly queued scan (status PENDING), not a finished result.
      const created: Scan = await response.json();
      setActiveScan(created);

      const finished = await waitForScan(created.id);
      await loadDatabase();

      if (!finished) {
        // Only surface this while the user is still signed in — otherwise the message would pop
        // up over the login screen after a logout mid-scan.
        if (localStorage.getItem('token')) {
          notify('The audit is still running on the server. It will appear in your history list once it finishes.', 'info');
        }
        return;
      }

      setActiveScan(finished);

      if (finished.status === 'FAILED') {
        notify('The audit failed. The target site may be unreachable, or it blocked the automated crawler.');
      }
    } catch (err: any) {
      notify(`${err?.message || 'The scan could not be started.'}`);
    } finally {
      setIsCrawlLoading(false);
    }
  };

  // Saved customize brand settings
  const saveBrandSettings = async (updatedSettings: WhiteLabelSettings) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      } else {
        notify('Could not update brand presets.');
      }
    } catch {
      notify('Network failure saving branding options.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Delete a scan from history
  const deleteScan = async (scanId: string) => {
    if (!confirm('Delete this scan? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/scans/${scanId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        notify('Failed to delete scan.');
        return;
      }
      if (activeScan?.id === scanId) setActiveScan(null);
      await loadDatabase();
    } catch {
      notify('Network failure deleting scan.');
    }
  };

  // Opens a scan that may not be in the (filtered) history list, e.g. from a monitor or a lead.
  const openScanById = async (scanId: string) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`, { headers: getAuthHeaders() });
      if (!res.ok) {
        notify('Could not open that scan.');
        return;
      }
      setActiveScan(await res.json());
      setActiveTab('audit');
    } catch {
      notify('Network failure opening scan.');
    }
  };

  const exportScans = async (format: 'csv' | 'json') => {
    const params = new URLSearchParams(buildScanFilterQuery());
    params.set('format', format);
    try {
      await downloadWithAuth(`/api/scans/export?${params.toString()}`, `seo_scans.${format}`);
    } catch (err: any) {
      notify(`Export failed: ${err?.message || 'unknown error'}`);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans antialiased pb-16 relative overflow-hidden">
      
      {/* BACKGROUND GLOWS (Frosted Glass Theme) */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[40vw] h-[40vw] bg-indigo-800 rounded-full blur-[100px]"></div>
      </div>

      {currentUser && currentUser.emailVerified === false && <VerifyEmailBanner email={currentUser.email} />}

      {/* PROFESSIONAL NAVBAR TOP */}
      <nav className="glass-nav sticky top-0 z-40 shadow-lg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="font-display font-extrabold text-white tracking-tight text-md flex items-center gap-1.5">
                <span>{settings.agencyName || 'SEO Scan Pro'}</span>
                <span className="text-[9px] font-mono tracking-widest bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-bold">V1.1</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Enterprise SEO Audit Command Center</p>
            </div>
          </div>

          {/* Quick Stats Badges for branding context */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase font-black">Scans Logged</div>
              <div className="text-xs font-bold text-slate-200"><AnimatedNumber value={scans.length} /> Audits</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase font-black">Active Mode</div>
              <div className="text-xs font-bold text-blue-400">Enterprise Agency</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
        
        {/* TABULAR LAYOUT CONTROLS */}
        <div className="flex overflow-x-auto border-b border-white/10 pb-px gap-1.5 scrollbar-none mb-8">
          {[
            { id: 'audit', label: 'Launch Audits', icon: Globe },
            { id: 'compare', label: 'Chronological delta', icon: History, badge: scans.length > 1 ? scans.length : undefined },
            { id: 'monitoring', label: 'Monitoring', icon: Activity },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'settings', label: 'White-Label Presets', icon: Palette },
            { id: 'widget', label: 'Client Lead Widget', icon: Code },
            { id: 'benchmark', label: 'Competitor Benchmark', icon: Award },
            { id: 'account', label: 'Account', icon: UserCog }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  // Load history comparison defaults on switch
                  if (tab.id === 'compare' && scans.length > 1 && !selectedCompareScan) {
                    const latest = scans.find(s => s.status === 'COMPLETED');
                    if (latest) {
                      const prev = scans.find(s => s.id !== latest.id && s.status === 'COMPLETED');
                      if (prev) {
                        setActiveScan(latest);
                        setSelectedCompareScan(prev);
                      }
                    }
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-3 px-4.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none whitespace-nowrap border focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${
                  isActive
                    ? 'text-white shadow-lg shadow-blue-500/20 border-white/20'
                    : 'glass-card border-transparent text-slate-400 hover:text-white glass-card-hover'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className={`relative h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="relative">{tab.label}</span>
                {tab.badge && (
                  <span className={`relative text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-inner ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIVE TABS DISPATCHER */}
        {/* Contain any render-time crash at this panel rather than unmounting the whole app and
            leaving a blank page — report bodies are unvalidated LLM output. */}
        <ErrorBoundary label="This report">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
          
          {/* TAB 1: AUDITS WORKBENCH */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column Entry Form + Quick History Log */}
              <div className="space-y-6 lg:col-span-1">
                <ScanForm
                  isLoading={isCrawlLoading}
                  auditEvents={auditEvents}
                  onScanSubmit={executeScan}
                  defaultUrl={activeScan ? activeScan.url : ''}
                />

                {/* HISTORICAL LOG CHECKLIST */}
                <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1">
                    <History className="h-3.5 w-3.5 text-slate-400" />
                    <span>Historical Audit Logs ({scans.length})</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search by URL"
                        className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="flex-1 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[11px] text-slate-200"
                      >
                        <option value="">All statuses</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold cursor-pointer select-none">
                        <input type="checkbox" checked={leadsOnly} onChange={(e) => setLeadsOnly(e.target.checked)} />
                        Leads only
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => exportScans('csv')} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/25 rounded-lg py-1.5 cursor-pointer">
                        <Download className="h-3 w-3" /> CSV
                      </button>
                      <button onClick={() => exportScans('json')} className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/25 rounded-lg py-1.5 cursor-pointer">
                        <Download className="h-3 w-3" /> JSON
                      </button>
                    </div>
                  </div>

                  {scans.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {scans.map(s => {
                        const isCurrent = activeScan?.id === s.id;
                        return (
                          <div
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveScan(s)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setActiveScan(s); }}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer group ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                : 'border-white/10 hover:border-white/20 bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="truncate w-2/3">
                              <div className="text-xs font-bold truncate break-all">{s.url}</div>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                {new Date(s.createdAt).toLocaleDateString()} • {s.mode === 'FULL_SITE' ? 'Full Crawl' : 'Single'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                s.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {s.status === 'COMPLETED' ? `${s.seoReport?.score?.overall || 0} Pts` : s.status}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deleteScan(s.id); }}
                                className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                title="Delete scan"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 font-semibold text-xs">
                      {historyQuery || statusFilter || leadsOnly ? 'No scans match these filters.' : 'No domains parsed yet. Complete your first scan above!'}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Core Dashboard Viewport */}
              <div className="lg:col-span-2">
                {isCrawlLoading ? (
                  <ScanRunningPanel events={auditEvents} target={scanningUrl} />
                ) : activeScan ? (
                  <ReportDashboard
                    scan={activeScan}
                    settings={settings}
                  />
                ) : (
                  <div className="glass-card rounded-3xl border border-dashed border-white/25 p-16 text-center shadow-lg">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-emerald-400/20 border border-white/10"
                    >
                      <FileSearch className="h-8 w-8 text-sky-200" />
                    </motion.div>
                    <h3 className="font-bold text-slate-200 text-md">No Audit Selection</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2">
                      Input your business website URL on the left or select an index from the history lists to open the analysis.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CHRONOLOGICAL COMPARISONS */}
          {activeTab === 'compare' && (
            <div>
              {activeScan ? (
                <ReportComparison
                  currentScan={activeScan}
                  historyScans={scans}
                  onSelectCompareScan={(compareId) => {
                    const chosen = scans.find(s => s.id === compareId);
                    if (chosen) setSelectedCompareScan(chosen);
                  }}
                  selectedCompareScan={selectedCompareScan}
                />
              ) : (
                <div className="glass-card rounded-3xl border border-dashed text-center p-12">
                  <span className="text-xs font-semibold text-slate-400">Please scan at least one target domain to access comparisons view.</span>
                </div>
              )}
            </div>
          )}

          {/* MONITORING & LEADS */}
          {activeTab === 'monitoring' && <MonitorsPanel onOpenScan={openScanById} />}
          {activeTab === 'leads' && (
            <div className="max-w-5xl mx-auto">
              <LeadsPanel onOpenScan={openScanById} />
            </div>
          )}

          {/* TAB 3: WHITE LABEL AGENCY EDIT */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <WhiteLabelEditor
                settings={settings}
                onSaveSettings={saveBrandSettings}
                isSaving={isSavingSettings}
              />
            </div>
          )}

          {/* TAB 4: CLIENT EMBED MAGNETS */}
          {activeTab === 'widget' && (
            <div className="max-w-4xl mx-auto">
              <WidgetEmbedBuilder appUrl="" widgetKey={currentUser?.widgetKey || ''} />
            </div>
          )}

          {/* TAB 5: COMPETITOR BENCHMARK */}
          {activeTab === 'benchmark' && (
            <div className="max-w-4xl mx-auto">
              <CompetitorBenchmark />
            </div>
          )}

          {/* TAB 6: ACCOUNT SETTINGS */}
          {activeTab === 'account' && currentUser && (
            <div className="max-w-2xl mx-auto">
              <AccountSettings
                currentEmail={currentUser.email}
                onEmailChanged={(newEmail) => setCurrentUser({ ...currentUser, email: newEmail })}
                onAccountDeleted={handleLogout}
              />
            </div>
          )}

          </motion.div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
