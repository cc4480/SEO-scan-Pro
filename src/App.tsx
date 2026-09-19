import React, { useState, useEffect } from 'react';
import { Scan, WhiteLabelSettings } from './types';
import ScanForm from './components/ScanForm';
import ReportDashboard from './components/ReportDashboard';
import ReportComparison from './components/ReportComparison';
import WhiteLabelEditor from './components/WhiteLabelEditor';
import WidgetEmbedBuilder from './components/WidgetEmbedBuilder';
import EmbedView from './components/EmbedView';
import CompetitorBenchmark from './components/CompetitorBenchmark';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ForgotPasswordForm from './components/Auth/ForgotPasswordForm';
import ResetPasswordForm from './components/Auth/ResetPasswordForm';
import AccountSettings from './components/AccountSettings';
import {
  Globe, Sliders, Palette, Code, History, TrendingUp, Sparkles,
  RefreshCw, CheckCircle2, ShieldAlert, Award, FileSearch, HelpCircle, LogOut, Trash2, UserCog
} from 'lucide-react';

export default function App() {
  const isEmbedPage = typeof window !== 'undefined' && window.location.pathname === '/embed';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string; widgetKey: string } | null>(null);

  if (isEmbedPage) {
    return <EmbedView />;
  }

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

  // Check authentication on mount
  useEffect(() => {
    loadCurrentUser()
      .then(ok => setIsAuthenticated(ok))
      .finally(() => setIsCheckingAuth(false));
  }, []);

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

  // Show login/register/forgot/reset if not authenticated
  if (!isAuthenticated) {
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

  const [scans, setScans] = useState<Scan[]>([]);
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    agencyName: 'SEO Scan Elite',
    primaryColor: '#0ea5e9',
    accentColor: '#1e40af',
    customFooter: 'Report provided by SEO Scan Pro • Powered by DeepSeek V4.',
    enabledSections: ['executive', 'technical', 'content', 'aeo-geo', 'checklist'],
    language: 'en'
  });

  const [activeTab, setActiveTab] = useState<'audit' | 'compare' | 'settings' | 'widget' | 'benchmark' | 'account'>('audit');
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [selectedCompareScan, setSelectedCompareScan] = useState<Scan | undefined>(undefined);
  const [isCrawlLoading, setIsCrawlLoading] = useState(false);
  const [apiStatusMsg, setApiStatusMsg] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  // Load Database stats on bootstrap
  const loadDatabase = async () => {
    try {
      const scansRes = await fetch('/api/scans', {
        headers: getAuthHeaders()
      });
      if (scansRes.ok) {
        const scansData = await scansRes.json();
        setScans(scansData);
        if (scansData.length > 0 && !activeScan) {
          // Default pre-open latest compiled scan
          const completed = scansData.find((s: Scan) => s.status === 'COMPLETED');
          if (completed) setActiveScan(completed);
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

  useEffect(() => {
    loadDatabase();
  }, []);

  // Run dynamic scanning triggers
  const executeScan = async (payload: { url: string; mode: any; depth: number; leadInfo?: any }) => {
    setIsCrawlLoading(true);
    setApiStatusMsg('Pinging destination host connectivity...');

    // Progress ticker array to entertain visitors during live analysis
    const statusTicks = [
      'Scanning robots.txt guidelines & sitemap hierarchies...',
      'Crawling internal layout anchor paths...',
      'Reviewing heading tag hierarchies & text sizes...',
      'Auditing visual media alternative attributes...',
      'Deploying semantic layout parsers...',
      'Summoning deep AI SEO optimizing models...'
    ];

    let tickerIdx = 0;
    const interval = setInterval(() => {
      if (tickerIdx < statusTicks.length) {
        setApiStatusMsg(statusTicks[tickerIdx]);
        tickerIdx++;
      }
    }, 1800);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Pipeline calculation failure');
      }

      const completedScan = await response.json();
      setActiveScan(completedScan);

      // Reload lists
      await loadDatabase();
    } catch (err: any) {
      alert(`SEO Audit Pipeline Halted: ${err?.message || 'Server timeout'}`);
    } finally {
      clearInterval(interval);
      setIsCrawlLoading(false);
      setApiStatusMsg('');
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
        alert('Could not update brand presets.');
      }
    } catch {
      alert('Network failure saving branding options.');
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
        alert('Failed to delete scan.');
        return;
      }
      if (activeScan?.id === scanId) setActiveScan(null);
      await loadDatabase();
    } catch {
      alert('Network failure deleting scan.');
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16 relative overflow-hidden">
      
      {/* BACKGROUND GLOWS (Frosted Glass Theme) */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[40vw] h-[40vw] bg-indigo-800 rounded-full blur-[100px]"></div>
      </div>

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
              <div className="text-xs font-bold text-slate-200">{scans.length} Audits</div>
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
                className={`py-3 px-4.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none whitespace-nowrap border ${
                  isActive
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border-white/20'
                    : 'glass-card border-transparent text-slate-400 hover:text-white glass-card-hover'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-inner ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIVE TABS DISPATCHER */}
        <div className="space-y-8">
          
          {/* TAB 1: AUDITS WORKBENCH */}
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column Entry Form + Quick History Log */}
              <div className="space-y-6 lg:col-span-1">
                <ScanForm
                  isLoading={isCrawlLoading}
                  statusMessage={apiStatusMsg}
                  onScanSubmit={executeScan}
                  defaultUrl={activeScan ? activeScan.url : ''}
                />

                {/* HISTORICAL LOG CHECKLIST */}
                <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1">
                    <History className="h-3.5 w-3.5 text-slate-400" />
                    <span>Historical Audit Logs ({scans.length})</span>
                  </h3>
                  
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
                      No domains parsed yet. Complete your first scan above!
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Core Dashboard Viewport */}
              <div className="lg:col-span-2">
                {activeScan ? (
                  <ReportDashboard
                    scan={activeScan}
                    settings={settings}
                  />
                ) : (
                  <div className="glass-card rounded-3xl border border-dashed border-white/25 p-16 text-center shadow-lg">
                    <FileSearch className="h-12 w-12 text-slate-500 mx-auto mb-3" />
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

        </div>
      </div>
    </div>
  );
}
