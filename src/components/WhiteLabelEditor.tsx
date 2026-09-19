import React, { useState } from 'react';
import { WhiteLabelSettings } from '../types';
import { Image, Palette, Eye, CheckCircle2, Languages, HelpCircle, Copy, Check, ShieldCheck } from 'lucide-react';

interface WhiteLabelEditorProps {
  settings: WhiteLabelSettings;
  onSaveSettings: (updated: WhiteLabelSettings) => void;
  isSaving: boolean;
}

const colorPalettes = [
  { name: 'Sky Royale', primary: '#0ea5e9', accent: '#1e40af', desc: 'Enterprise clarity' },
  { name: 'Emerald Forest', primary: '#10b981', accent: '#065f46', desc: 'Sustainable organic growth' },
  { name: 'Cosmic Iris', primary: '#8b5cf6', accent: '#4c1d95', desc: 'Creative technical excellence' },
  { name: 'Charcoal Minimal', primary: '#334155', accent: '#0f172a', desc: 'Vibe-aligned modern tech' },
  { name: 'Sunset Bronze', primary: '#f97316', accent: '#7c2d12', desc: 'High conversion urgency' }
];

const presetLogos = [
  { name: 'Default Brand', url: '' },
  { name: 'SEO Spark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&auto=format&fit=crop&q=60' },
  { name: 'Helix Analytics', url: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=100&h=100&auto=format&fit=crop&q=60' }
];

export default function WhiteLabelEditor({ settings, onSaveSettings, isSaving }: WhiteLabelEditorProps) {
  const [agencyName, setAgencyName] = useState(settings.agencyName || 'SEO Audit Pro');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [customFooter, setCustomFooter] = useState(settings.customFooter);
  const [language, setLanguage] = useState<'en' | 'es'>(settings.language || 'en');
  const [enabledSections, setEnabledSections] = useState<string[]>(settings.enabledSections || ['executive', 'technical', 'content', 'aeo-geo', 'checklist']);
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [monitoringEmail, setMonitoringEmail] = useState(settings.monitoringEmail || '');
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(!!settings.enableEmailAlerts);
  const [secretCopied, setSecretCopied] = useState(false);

  const copyWebhookSecret = () => {
    if (!settings.webhookSecret) return;
    navigator.clipboard.writeText(settings.webhookSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleToggleSection = (sectionId: string) => {
    if (enabledSections.includes(sectionId)) {
      setEnabledSections(enabledSections.filter(s => s !== sectionId));
    } else {
      setEnabledSections([...enabledSections, sectionId]);
    }
  };

  const handlePaletteSelect = (primary: string, accent: string) => {
    setPrimaryColor(primary);
    setAccentColor(accent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      agencyName,
      logoUrl,
      primaryColor,
      accentColor,
      customFooter,
      language,
      enabledSections,
      webhookUrl,
      monitoringEmail,
      enableEmailAlerts
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Palette className="text-blue-400 h-5 w-5" />
          <span>White-Label Report Customizer</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Apply your agency brand logo, customized coloring palettes, and disclosures. Applied to all downloaded PDF reports.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Agency Name
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              placeholder="SEO Analytics Studio"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:bg-white/10 focus:ring-2 focus:ring-blue-500 transition focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Branded Logo URL
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://mysite.com/logo.png"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:bg-white/10 focus:ring-2 focus:ring-blue-500 transition focus:outline-none"
            />
          </div>
        </div>

        {/* Preset Logos helper */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span>Preset Icon Assets</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {presetLogos.map((pl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLogoUrl(pl.url)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer select-none ${
                  logoUrl === pl.url 
                    ? 'bg-blue-500 text-white border-transparent shadow' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {pl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette customization */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Report Coloring Schemes
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {colorPalettes.map((cp, idx) => {
              const isActive = primaryColor === cp.primary && accentColor === cp.accent;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePaletteSelect(cp.primary, cp.accent)}
                  className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                    isActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">{cp.name}</div>
                    <div className="text-[10px] text-slate-405 mt-0.5">{cp.desc}</div>
                  </div>
                  <div className="flex gap-1.5 font-sans">
                    <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: cp.primary }} />
                    <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: cp.accent }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                   onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 p-0.5 border border-white/10 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full bg-white/5 text-xs font-mono border border-white/10 rounded-lg px-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 p-0.5 border border-white/10 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full bg-white/5 text-xs font-mono border border-white/10 rounded-lg px-2 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Visibility Controls */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Enabled PDF Report Sections
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'executive', label: 'Executive Review' },
              { id: 'technical', label: 'Technical Crawl Details' },
              { id: 'content', label: 'Semantic/Content Metrics' },
              { id: 'aeo-geo', label: 'AI Answer (AEO) Engine' },
              { id: 'checklist', label: 'Action Items Checklist' }
            ].map(sec => {
              const isChecked = enabledSections.includes(sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleToggleSection(sec.id)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition cursor-pointer select-none ${
                    isChecked 
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{sec.label}</span>
                  <CheckCircle2 className={`h-4 w-4 shrink-0 transition ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Footer */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Signature / Footer Disclosure Notes
          </label>
          <input
            type="text"
            value={customFooter}
            onChange={(e) => setCustomFooter(e.target.value)}
            placeholder="Report generated exclusively for clients of SEO Spark Inc."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:bg-white/10 focus:ring-2 focus:ring-blue-500 transition focus:outline-none"
          />
        </div>

        {/* Lead capture webhooks and Automated alerts integrations */}
        <div className="border-t border-white/10 pt-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Lead Capture & Monitoring Integrations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                Lead Delivery Webhook URL (e.g. Zapier, Make, HubSpot)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">Sends Name, Email, Website & Scan score instantly.</span>

              {settings.webhookSecret && (
                <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      Webhook Signing Secret
                    </span>
                    <button
                      type="button"
                      onClick={copyWebhookSecret}
                      className="text-[9px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      {secretCopied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                    </button>
                  </div>
                  <code className="text-[9px] text-slate-300 font-mono break-all block">{settings.webhookSecret}</code>
                  <p className="text-[9px] text-slate-500 mt-1.5">
                    Every request includes an <code className="text-slate-400">X-SEOScan-Signature</code> header (HMAC-SHA256 of the raw body, using this secret). Verify it to confirm requests genuinely came from us.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                Automated Site Monitoring Alert Email
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={monitoringEmail}
                  onChange={(e) => setMonitoringEmail(e.target.value)}
                  placeholder="alerts@agency.com"
                  disabled={!enableEmailAlerts}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-medium focus:bg-white/10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setEnableEmailAlerts(!enableEmailAlerts)}
                  className={`px-4 rounded-xl text-xs font-bold transition select-none ${
                    enableEmailAlerts 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' 
                      : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}
                >
                  {enableEmailAlerts ? 'Alerts ON' : 'Alerts OFF'}
                </button>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 block">Notifies you if standard scores fall below 75 Pts.</span>
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="border-t border-white/10 pt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="text-slate-400 h-4 w-4" />
            <span className="text-xs font-bold text-slate-300">Audit Report Language Set</span>
          </div>
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
               type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                language === 'en' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                language === 'es' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Español
            </button>
          </div>
        </div>

        {/* Settings Action Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm select-none py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 transition cursor-pointer active:scale-[0.99]"
        >
          {isSaving ? 'Applying Settings...' : 'Save and Apply White-Label Settings'}
        </button>
      </form>
    </div>
  );
}
