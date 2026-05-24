import React, { useState } from 'react';
import { 
  Check, X, Sparkles, Shield, Award, Activity, 
  HelpCircle, Link, Mail, Zap, TrendingUp, Cpu
} from 'lucide-react';

export default function CompetitorBenchmark() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'key' | 'ai' | 'branding'>('all');

  const comparisonSpecs = [
    {
      feature: 'Artificial Intelligence GEO Audit',
      category: 'ai',
      ourApp: { ok: true, note: 'Gemini-Powered analysis modeling conversational engine visibility (ChatGPT Search, Perplexity)' },
      seoptimer: { ok: false, note: 'Legacy code scanner only' },
      woorank: { ok: false, note: 'Static meta validator only' },
      sitechecker: { ok: false, note: 'On-page rules check only' }
    },
    {
      feature: 'Generative Engine Optimization (AEO)',
      category: 'ai',
      ourApp: { ok: true, note: 'Identifies structured FAQ blocks, rich schema eligibility & voice search friendliness scores' },
      seoptimer: { ok: false, note: 'Not supported' },
      woorank: { ok: false, note: 'Not supported' },
      sitechecker: { ok: false, note: 'Not supported' }
    },
    {
      feature: 'Interactive Implementation Checklist',
      category: 'key',
      ourApp: { ok: true, note: 'Active checklist allowing users to cross-off fixes & dynamically increment completion scores' },
      seoptimer: { ok: false, note: 'Static non-interactive PDF' },
      woorank: { ok: false, note: 'Dull static text overview' },
      sitechecker: { ok: false, note: 'Static tabular lists' }
    },
    {
      feature: 'White-Label Branding Autonomy',
      category: 'branding',
      ourApp: { ok: true, note: 'Custom colors, logos, footers, & customized report sections included' },
      seoptimer: { ok: true, note: 'Locked behind $59/mo Whitelabel tier' },
      woorank: { ok: true, note: 'Locked behind $119/mo Premium plan' },
      sitechecker: { ok: true, note: 'Locked behind $149/mo Agency package' },
    },
    {
      feature: 'Standalone HTML Compiler Export',
      category: 'branding',
      ourApp: { ok: true, note: 'Downloads fully styled, responsive, lightweight self-contained HTML (one-click Print-to-PDF ready)' },
      seoptimer: { ok: false, note: 'Static PDFs only' },
      woorank: { ok: false, note: 'Capped PDFs or dashboard exports' },
      sitechecker: { ok: false, note: 'Hosted reports links only' }
    },
    {
      feature: 'Lead Capture CRM Webhooks',
      category: 'branding',
      ourApp: { ok: true, note: 'Real-time integrations posting leads automatically to agency webhooks (Zapier, HubSpot, Make)' },
      seoptimer: { ok: true, note: 'Supported' },
      woorank: { ok: false, note: 'No public widgets webhooks' },
      sitechecker: { ok: true, note: 'Supported' }
    },
    {
      feature: 'Chronological Comparison Delta Chart',
      category: 'key',
      ourApp: { ok: true, note: 'Side-by-side historical reports delta comparison showcasing agency value to clients' },
      seoptimer: { ok: false, note: 'Lacks interactive comparative charts' },
      woorank: { ok: false, note: 'Overwritten snapshots with no delta breakdown' },
      sitechecker: { ok: false, note: 'No direct chronological comparisons' }
    },
    {
      feature: 'Flexible Live-Crawl Sandbox Failsafe',
      category: 'key',
      ourApp: { ok: true, note: 'Combines dynamic fetch checks with adaptive sandboxed crawling to prevent DNS/CORS blocks' },
      seoptimer: { ok: true, note: 'Cloud proxy crawls' },
      woorank: { ok: true, note: 'Standard cloud crawlers' },
      sitechecker: { ok: true, note: 'Standard proxy crawlers' }
    }
  ];

  const filteredSpecs = comparisonSpecs.filter(
    s => activeFilter === 'all' || s.category === activeFilter
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Header */}
      <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 bottom-0 right-0 w-1/3 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded inline-block">
              Niche Market Analysis
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-3">
              Competitive Intelligence Assessment
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing how our advanced artificial intelligence pipeline compares with industry majors: SEOptimer, WooRank, and Sitechecker.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 select-none">
            <Cpu className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-black uppercase">Core Differentiator</div>
              <div className="text-xs font-extrabold text-white">AI-Powered GEO Audit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid highlighting the main surpassing features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bento Card 1 */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-200 text-sm">Generative Google/Chatbot SEO</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Unlike competitors focusing purely on 2015 meta metrics, our engine is built for the <strong>Generative Search Era</strong> (Google’s SGE, ChatGPT Search, Bard, Perplexity). We score AI Trustworthiness and direct answer accessibility.
            </p>
          </div>
          <span className="text-[10px] text-amber-300 font-bold tracking-wide mt-4 block">SURPASSES NORMALLY LOCKED MAJORS</span>
        </div>

        {/* Bento Card 2 */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-200 text-sm">Real-time Webhook lead pushes</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Capture leads dynamically using our customizable modal widget on your site. Trigger live webhooks instant posting client SEO inputs into HubSpot or Slack channels. Perfect for cold outreach conversion.
            </p>
          </div>
          <span className="text-[10px] text-blue-300 font-bold tracking-wide mt-4 block">100% PRODUCTION INTEGRATION READY</span>
        </div>

        {/* Bento Card 3 */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-slate-200 text-sm">Chronological Progress Deltas</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Run comparative maps showcasing how a target site’s seo health, sizes, and error stats improve over time. Prove direct consulting ROI to prospects in seconds with side-by-side delta matrices.
            </p>
          </div>
          <span className="text-[10px] text-indigo-300 font-bold tracking-wide mt-4 block">LEGACY COMPETITORS LACK INTERACTIVE DELTAS</span>
        </div>

      </div>

      {/* Comparison Matrix Table */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-white/5 border-b border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Award className="text-blue-400 h-4 w-4" />
              <span>Diagnostic Comparison Matrix</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Side-by-side spec layout outlining our edge over major SEO software brands.</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
            {[
              { id: 'all', label: 'All features' },
              { id: 'key', label: 'Key Core tools' },
              { id: 'ai', label: 'AEO / Bot SEO' },
              { id: 'branding', label: 'Agency custom' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer select-none whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column descriptors */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] text-slate-400 uppercase font-black tracking-wider">
                <th className="p-4 pl-6">Analysis Spec / Feature</th>
                <th className="p-4 text-center">Our Platform</th>
                <th className="p-4 text-center">SEOptimer</th>
                <th className="p-4 text-center">WooRank</th>
                <th className="p-4 text-center">Sitechecker</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecs.map((spec, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-5 pl-6">
                    <span className="text-xs font-bold text-slate-100 block">{spec.feature}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 italic">{spec.ourApp.note}</span>
                  </td>
                  
                  {/* Our App Column */}
                  <td className="p-4 text-center bg-blue-500/10">
                    <div className="inline-flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-black tracking-wider text-emerald-400 uppercase mt-1">Surpasses</span>
                    </div>
                  </td>

                  {/* SEOptimer Column */}
                  <td className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      {spec.seoptimer.ok ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                          <X className="h-3 w-3" />
                         </div>
                      )}
                      <span className="text-[9px] text-slate-500 max-w-24 leading-tight truncate mt-1 block">{spec.seoptimer.note}</span>
                    </div>
                  </td>

                  {/* WooRank Column */}
                  <td className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      {spec.woorank.ok ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                      <span className="text-[9px] text-slate-500 max-w-24 leading-tight truncate mt-1 block">{spec.woorank.note}</span>
                    </div>
                  </td>

                  {/* Sitechecker Column */}
                  <td className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      {spec.sitechecker.ok ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                      <span className="text-[9px] text-slate-500 max-w-24 leading-tight truncate mt-1 block">{spec.sitechecker.note}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strategic Vision check info */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#182a4d]/50 to-indigo-950/40 border border-white/10 p-6 rounded-2xl flex items-start gap-4 shadow-lg text-xs">
        <div className="p-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg shrink-0">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-white text-sm">Deployment Ready Competitive Verdict</h4>
          <p className="text-slate-300 leading-relaxed mt-1 font-medium">
            While basic systems score simple layout headers, we encompass conversational, intent-based, and semantic engine compatibility out-of-the-box. Additionally, by implementing <strong>Lead magnet webhooks & Standalone report compilation</strong>, our platform removes agency dependencies on costly subscription tiers, offering unlimited freedom of branding.
          </p>
        </div>
      </div>
    </div>
  );
}
