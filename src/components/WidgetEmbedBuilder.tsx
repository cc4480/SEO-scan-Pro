import React, { useState } from 'react';
import { Code, Share2, Copy, Check, Sparkles, Mail, Send, Award } from 'lucide-react';

interface WidgetEmbedBuilderProps {
  appUrl: string;
  widgetKey: string;
}

export default function WidgetEmbedBuilder({ appUrl, widgetKey }: WidgetEmbedBuilderProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isCrawlLoading, setIsCrawlLoading] = useState(false);

  // Fallback to current window host if appUrl is undefined/blank
  const baseHost = appUrl || window.location.origin;
  const embedCode = `<iframe src="${baseHost}/embed?key=${widgetKey}" width="100%" height="480" style="border:none; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.05);" title="Free SEO Audit Widget"></iframe>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !email || !widgetKey) return;

    setIsCrawlLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/widget/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, email, name, widgetKey })
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult(data);
      } else {
        alert(data.error || 'Widget processing halted temporarily.');
      }
    } catch {
      alert('Network timeout running widget audit.');
    } finally {
      setIsCrawlLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Informational Panel */}
      <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code className="text-blue-400 h-5 w-5" />
            <span>Lead Generation Embeddable Widget</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Embed a clean audit input on your agency website. Visitors can input their domain and input email to generate instantly white-labeled lead magnet audits!
          </p>
        </div>

        {/* Action Copyable Row */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wide">Embed iframe block</span>
            <button
              onClick={copyCode}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied embed script</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy code snippet</span>
                </>
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={embedCode}
            className="w-full h-18 bg-black/40 text-slate-300 rounded-lg p-3 text-[10px] font-mono border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Live Simulator Interface */}
      <div className="glass-card p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2 font-mono">
            <Sparkles className="text-amber-400 h-4 w-4" />
            <span>Live - Widget Embed Preview</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">Interact with the real widget below to test lead conversion experience.</p>
        </div>

        {/* Simulator Frame Container */}
        <div className="bg-[#131d35]/60 backdrop-blur-xl max-w-lg mx-auto rounded-3xl shadow-2xl overflow-hidden border border-white/15">
          <div className="bg-gradient-to-r from-slate-900/80 to-[#1d273f]/85 px-6 py-5 text-center text-white border-b border-white/10">
            <h4 className="font-extrabold tracking-tight text-md">Free Professional SEO Appraisal</h4>
            <p className="text-[10px] text-indigo-300 mt-1">Discover your organic traffic red flags and AI search index score in 15 seconds.</p>
          </div>

          <div className="p-6">
            {!testResult ? (
              <form onSubmit={simulateWidgetSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Web Domain</label>
                  <input
                    type="text"
                    required
                    placeholder="my-landing-site.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isCrawlLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isCrawlLoading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email (To Receive Report)</label>
                    <input
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isCrawlLoading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCrawlLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-xs py-3 rounded-lg text-white shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCrawlLoading ? 'Analyzing code...' : 'Instant Complete Analysis'}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center animate-fadeIn">
                <div className="w-14 h-14 bg-white/10 border border-white/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Scan Complete!</h5>
                  <p className="text-xs text-slate-400 mt-1">Audit profile generated for <span className="font-mono text-blue-400 text-[11px]">{url}</span></p>
                </div>

                {/* Score badge */}
                <div className="bg-white/5 p-3 rounded-xl max-w-xs mx-auto text-center border border-white/10 flex justify-between items-center">
                  <div className="text-left select-none">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall Score</span>
                    <div className="text-md font-extrabold text-blue-400">{testResult.score}/100</div>
                  </div>
                  <div className="text-right select-none">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Critical Issues</span>
                    <div className="text-md font-extrabold text-red-400">{testResult.criticalIssuesCount} Warns</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 text-left line-clamp-3 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3">
                  "{testResult.executiveSummary}"
                </p>

                <div className="space-y-2 pt-2">
                  <a
                    href={`/api/report/${testResult.scanId}/download`}
                    target="_blank"
                    className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg active:scale-[0.98] transition shadow-lg shadow-indigo-500/10"
                  >
                    Download PDF Report
                  </a>
                  <button
                    onClick={() => {
                      setTestResult(null);
                      setUrl('');
                      setEmail('');
                      setName('');
                    }}
                    className="block w-full text-xs text-slate-450 hover:text-blue-400 font-bold transition"
                  >
                    Run Another Mock Client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
