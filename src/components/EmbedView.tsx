import React, { useState } from 'react';
import { Award, RefreshCw, Send, Sparkles, CheckSquare } from 'lucide-react';

export default function EmbedView() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isCrawlLoading, setIsCrawlLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const widgetKey = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('key') || ''
    : '';

  const widgetTicks = [
    'Verifying url hostname connectivity...',
    'Scanned robots.txt guidelines & sitemap hierarchies...',
    'Crawling metadata & landing anchor paths...',
    'Reviewing heading tag hierarchies & headings...',
    'Auditing alternative media descriptions...',
    'Calculating AI SEO Friendliness indices...'
  ];

  const handleWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !email.trim()) return;

    if (!widgetKey) {
      alert('This widget is not correctly configured (missing key). Please contact the site owner.');
      return;
    }

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setIsCrawlLoading(true);
    setTestResult(null);
    setStatusMessage(widgetTicks[0]);

    let tickerIdx = 1;
    const interval = setInterval(() => {
      if (tickerIdx < widgetTicks.length) {
        setStatusMessage(widgetTicks[tickerIdx]);
        tickerIdx++;
      }
    }, 1500);

    try {
      const response = await fetch('/api/widget/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, email: email.trim(), name: name.trim(), widgetKey })
      });
      clearInterval(interval);

      const data = await response.json();
      if (response.ok) {
        setTestResult(data);
      } else {
        alert(data.error || 'Widget audit engine halted temporarily.');
      }
    } catch {
      alert('Network timeout running widget audit.');
    } finally {
      clearInterval(interval);
      setIsCrawlLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex items-center justify-center p-4">
      {/* Decorative ambient radial light */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[150px] h-[150px] bg-blue-500 rounded-full blur-[60px]" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-[#0f172a]/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-center border-b border-white/10">
            <h4 className="font-display font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5 text-sm md:text-base">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Free Professional SEO Appraisal</span>
            </h4>
            <p className="text-[10px] text-indigo-200 mt-1 font-medium">
              Discover your organic traffic red flags and AI search index score in 15 seconds.
            </p>
          </div>

          <div className="p-6">
            {!testResult ? (
              <form onSubmit={handleWidgetSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                    Target Web Domain
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="my-landing-site.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isCrawlLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isCrawlLoading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isCrawlLoading}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCrawlLoading || !url.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-xs py-3 rounded-lg text-white shadow-lg active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCrawlLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing site profiles...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      <span>Instant Complete Analysis</span>
                    </>
                  )}
                </button>

                {isCrawlLoading && statusMessage && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse mt-2.5 font-mono">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-5 text-center animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Award className="h-5.5 w-5.5 animate-pulse" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Scan Complete!</h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Audit profile generated for <span className="font-mono text-blue-400 text-[11px] font-semibold">{url}</span>
                  </p>
                </div>

                {/* Technical Score badges */}
                <div className="bg-white/5 p-3 rounded-xl max-w-xs mx-auto text-center border border-white/10 flex justify-between items-center gap-4">
                  <div className="text-left select-none">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Overall Score</span>
                    <div className="text-sm font-black text-blue-400 leading-none mt-1">{testResult.score}/100</div>
                  </div>
                  <div className="text-right select-none">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Critical Issues</span>
                    <div className="text-sm font-black text-red-400 leading-none mt-1">{testResult.criticalIssuesCount} Warns</div>
                  </div>
                </div>

                <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-left">
                  <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wide block mb-1">Executive Summary</span>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed italic pr-1">
                    "{testResult.executiveSummary}"
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <a
                    href={`/api/report/${testResult.scanId}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg active:scale-[0.98] transition shadow-lg shadow-indigo-500/10"
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
                    className="block w-full text-xs text-slate-450 hover:text-blue-400 font-bold transition cursor-pointer select-none"
                  >
                    Run Another Analysis
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
