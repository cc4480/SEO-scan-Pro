import React, { useState } from 'react';
import { ScanMode } from '../types';
import { Globe, ShieldAlert, Sliders, Layers, Search, RefreshCw, Send } from 'lucide-react';

interface ScanFormProps {
  onScanSubmit: (payload: { url: string; mode: ScanMode; depth: number; leadInfo?: { email: string; name?: string } }) => void;
  isLoading: boolean;
  statusMessage?: string;
  defaultUrl?: string;
}

export default function ScanForm({ onScanSubmit, isLoading, statusMessage, defaultUrl = '' }: ScanFormProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [mode, setMode] = useState<ScanMode>('SINGLE');
  const [depth, setDepth] = useState(3);
  const [showLeadCap, setShowLeadCap] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const payload: any = {
      url: cleanUrl,
      mode,
      depth: mode === 'SINGLE' ? 1 : depth,
    };

    if (showLeadCap && leadEmail.trim()) {
      payload.leadInfo = {
        email: leadEmail.trim(),
        name: leadName.trim() || undefined
      };
    }

    onScanSubmit(payload);
  };

  return (
    <div className="glass-card rounded-2xl shadow-xl p-6 md:p-8 relative overflow-hidden" id="scan-form">
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 opacity-90" />
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Globe className="text-blue-400 h-5 w-5" />
          <span>Launch Enterprise Audit</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform a deep-dive SEO crawl and generate white-label PDF checklists backed by Gemini AI.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
            Target Domain or Specific Path
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-medium text-sm select-none">
              https://
            </span>
            <input
              type="text"
              placeholder="example.com"
              value={url.replace(/^https?:\/\//i, '')}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              required
              className="w-full pl-18 pr-12 py-3.5 glass-input rounded-xl text-white text-sm font-medium transition"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('SINGLE')}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 text-xs font-bold tracking-wide transition cursor-pointer ${
              mode === 'SINGLE'
                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            Single URL Scan
          </button>
          
          <button
            type="button"
            onClick={() => setMode('FULL_SITE')}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border-2 text-xs font-bold tracking-wide transition cursor-pointer ${
              mode === 'FULL_SITE'
                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Deep Site Crawl
          </button>
        </div>

        {/* Crawl Settings */}
        {mode === 'FULL_SITE' && (
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 animate-fadeIn space-y-3">
            <div className="flex justify-between items-center text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 font-bold">
                Crawl Depth Limit:
                <span className="text-blue-400">{depth} levels</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">Autodetects Sitemap</span>
            </div>
            <input
              type="range"
              min="2"
              max="5"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 px-1 font-semibold">
              <span>Deep crawl (2 pages)</span>
              <span>Recursive max (5 pages)</span>
            </div>
          </div>
        )}

        {/* Optional Lead Magnet Capture Settings for agency prospecting */}
        <div className="border-t border-white/15 pt-5">
          <button
            type="button"
            onClick={() => setShowLeadCap(!showLeadCap)}
            className="text-xs text-slate-300 hover:text-blue-400 font-bold flex items-center gap-1.5 transition select-none cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block animate-ping" />
            {showLeadCap ? 'Hide Agency Prospect Details' : 'Attach Lead/Prospect Contact (Agency Mode)'}
          </button>

          {showLeadCap && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contact/Prospect Email
                </label>
                <input
                  type="email"
                  placeholder="prospect@company.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium glass-input rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prospect Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Jane Miller"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium glass-input rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Launch Control */}
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className={`w-full text-white font-bold text-sm select-none py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition ${
            isLoading || !url.trim()
              ? 'bg-white/5 border border-white/10 shadow-none cursor-not-allowed text-slate-500'
              : 'bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/20 active:scale-[0.98]'
          }`}
          id="btn-trigger-scan"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white/80" />
              <span>Crawl Active...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Launch Live SEO Analysis</span>
            </>
          )}
        </button>

        {/* Crawl Pipeline Messages */}
        {isLoading && statusMessage && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2.5 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold leading-relaxed font-mono">{statusMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
}
