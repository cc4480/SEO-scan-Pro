import React, { useState } from 'react';
import { Scan, WhiteLabelSettings } from '../types';
import {
  Download, Sparkles, CheckSquare, AlertTriangle, ShieldCheck,
  Clock, Server, HelpCircle, ChevronDown, ChevronUp, Image as ImageIcon,
  ExternalLink, FileSpreadsheet, Eye, ClipboardCheck, FileText
} from 'lucide-react';

interface ReportDashboardProps {
  scan: Scan;
  settings: WhiteLabelSettings;
}

export default function ReportDashboard({ scan, settings }: ReportDashboardProps) {
  const [completedFixes, setCompletedFixes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'content' | 'aeo-geo' | 'performance'>('all');
  const [expandedHeadings, setExpandedHeadings] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState(false);

  if (scan.status !== 'COMPLETED' || !scan.seoReport) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center shadow-lg">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2 animate-bounce" />
        <h3 className="font-bold text-white text-sm">Audit Processing Failed</h3>
        <p className="text-xs text-slate-400 mt-1">
          This scan could not resolve successfully. Please verify your internet connection or try another target URL domain.
        </p>
      </div>
    );
  }

  const { score, executiveSummary, criticalIssues, recommendedFixes, aeoAssessment, competitorComparisonText } = scan.seoReport;
  const isEs = settings.language === 'es';

  const toggleCheckFix = (fixTitle: string) => {
    if (completedFixes.includes(fixTitle)) {
      setCompletedFixes(completedFixes.filter(t => t !== fixTitle));
    } else {
      setCompletedFixes([...completedFixes, fixTitle]);
    }
  };

  const filteredFixes = recommendedFixes.filter(f => activeTab === 'all' || f.category === activeTab);

  // Math helper for completion stats
  const completionPercent = recommendedFixes.length > 0 
    ? Math.round((completedFixes.length / recommendedFixes.length) * 100) 
    : 0;

  const hasSimulatedData = scan.crawlData?.hasSimulatedData === true;

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* SIMULATED DATA WARNING — the target site could not actually be reached during this scan */}
      {hasSimulatedData && (
        <div className="bg-red-500/15 border-2 border-red-500/40 text-red-200 rounded-2xl p-5 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-red-100 text-sm uppercase tracking-wide">
              {isEs ? 'Datos Simulados — No es una Auditoría Real' : 'Simulated Data — Not a Real Audit'}
            </h3>
            <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
              {isEs
                ? 'No se pudo acceder al sitio de destino durante este escaneo (fuera de línea, bloqueado, o tiempo de espera agotado). Los datos y puntuaciones mostrados a continuación son marcadores de posición ilustrativos, no un análisis real del sitio.'
                : 'The target site could not be reached during this scan (offline, blocked, or timed out). The data and scores shown below are illustrative placeholders, not a real analysis of the site. Re-run the scan once the target is reachable.'}
            </p>
          </div>
        </div>
      )}

      {/* WHITE LABEL REPORT ACTIONS BAR */}
      <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-emerald-400 opacity-80" />
        <div>
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded">
            {isEs ? 'Auditoría White-Label Lista' : 'White-Label Audit Ready'}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-2.5">
            {isEs ? 'Descarga tu Reporte en PDF' : 'Download Complete Agency Report'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEs ? 'Descarga un archivo HTML standalone auto-maquetado para imprimir y enviar por email.' : 'Equipped with custom logo, coloring schemes, and complete diagnostic descriptions.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`/api/report/${scan.id}/download?format=pdf`}
            target="_blank"
            className="bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2 transition active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>{isEs ? 'Descargar PDF' : 'Download PDF'}</span>
          </a>
          <a
            href={`/api/report/${scan.id}/download`}
            target="_blank"
            title={isEs ? 'Descargar como HTML' : 'Download as HTML'}
            className="bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs px-4 py-3.5 rounded-xl shadow cursor-pointer flex items-center gap-2 transition active:scale-[0.98] border border-white/10"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{isEs ? 'HTML' : 'HTML'}</span>
          </a>
        </div>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* SCORE GAUGE OVERALL */}
        <div className="glass-card rounded-2xl p-5 shadow-lg text-center relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: settings.primaryColor }} />
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Overall SEO Health</span>
          <div className="text-4xl font-extrabold mt-2.5" style={{ color: settings.primaryColor || '#60a5fa' }}>
            {score.overall}<span className="text-xs font-normal text-slate-405">/100</span>
          </div>
          <div className="mt-1.5 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${score.overall}%`, backgroundColor: settings.primaryColor || '#60a5fa' }} />
          </div>
        </div>

        {/* TECHNICAL */}
        <div className="glass-card rounded-2xl p-5 shadow-lg text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Technical SEO</span>
          <div className="text-3xl font-extrabold text-blue-400 mt-2.5">{score.technical}%</div>
          <div className="mt-1.5 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${score.technical}%` }} />
          </div>
        </div>

        {/* CONTENT */}
        <div className="glass-card rounded-2xl p-5 shadow-lg text-center flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Semantic / Content</span>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2.5">{score.content}%</div>
          <div className="mt-1.5 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${score.content}%` }} />
          </div>
        </div>

        {/* AEO / AI GEO */}
        <div className="glass-card rounded-2xl p-5 shadow-lg text-center flex flex-col items-center justify-center col-span-1">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">AI Engine/AEO</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2.5">{score.aeoGeo}%</div>
          <div className="mt-1.5 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${score.aeoGeo}%` }} />
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="glass-card rounded-2xl p-5 shadow-lg text-center flex flex-col items-center justify-center col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wide">Loading Performance</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2.5">{score.performance}%</div>
          <div className="mt-1.5 h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${score.performance}%` }} />
          </div>
        </div>
      </div>

      {/* EXECUTIVE ANALYSIS STATEMENT */}
      {settings.enabledSections.includes('executive') && (
        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row gap-6 items-start relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-60" />
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-md">Executive Analysis & Brand Perspective</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium mt-2 break-normal">
              {executiveSummary}
            </p>
            {competitorComparisonText && (
              <div className="border-t border-white/10 mt-4 pt-4 text-[11px] text-slate-400 font-semibold italic">
                Competitive comparison: {competitorComparisonText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRITICAL WARNINGS RED FLAGS */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-md">
          <h3 className="text-red-300 font-bold text-sm tracking-tight flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span>Red Flag Warnings Requiring Resolution</span>
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalIssues.map((issue, idx) => (
              <li key={idx} className="bg-white/5 border border-white/10 hover:bg-white/10 transition rounded-xl p-3 text-xs text-slate-200 flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DETAILED ACTION ITEMS CHECKLIST */}
      {settings.enabledSections.includes('checklist') && (
        <div className="glass-card rounded-2xl shadow-xl overflow-hidden animate-fadeIn" id="action-checklist">
          {/* Header check metrics */}
          <div className="bg-white/5 border-b border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckSquare className="text-blue-400 h-4 w-4" />
                <span>Fix Implementation Checklist</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Interactive tasks representing your audit recommendations list.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Task Completion:</span>
              <div className="relative w-28 h-4 bg-white/10 rounded-full overflow-hidden text-center text-[9px] font-black text-white flex items-center justify-center">
                <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all opacity-80" style={{ width: `${completionPercent}%` }} />
                <span className="relative text-white z-10">{completionPercent}%</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'all', label: 'All recommendations' },
                { id: 'technical', label: 'Technical Core' },
                { id: 'content', label: 'Content Relevancy' },
                { id: 'aeo-geo', label: 'AEO / Generative SEO' },
                { id: 'performance', label: 'Speed & sizes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'bg-white/5 text-slate-305 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List checklist items */}
            <div className="space-y-4">
              {filteredFixes.map((fix, idx) => {
                const isChecked = completedFixes.includes(fix.title);
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-xl p-5 hover:bg-white/5 bg-white/5 transition select-none flex items-start gap-4 ${
                      isChecked ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => toggleCheckFix(fix.title)}
                      className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center cursor-pointer transition ${
                        isChecked ? 'border-emerald-600 bg-emerald-500 text-white' : 'border-white/20'
                      }`}
                    >
                      {isChecked && <ClipboardCheck className="h-3.5 w-3.5" />}
                    </button>

                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          fix.priority === 'high' ? 'bg-red-500/20 text-red-300' : 
                          fix.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-slate-300'
                        }`}>{fix.priority} priority</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-400">{fix.category}</span>
                      </div>
                      
                      <h4 className={`font-bold text-slate-100 text-sm ${isChecked ? 'line-through text-slate-500' : ''}`}>
                        {fix.title}
                      </h4>
                      <p className="text-xs text-slate-350 leading-relaxed">{fix.description}</p>
                      
                      <div className="bg-black/20 p-3.5 rounded-xl border border-white/10 mt-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Implementation Guidelines</span>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed leading-normal whitespace-pre-line">{fix.remediation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TECH METRICS ANALYSIS CRAWL DETAILS */}
      {settings.enabledSections.includes('technical') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Crawl stats column */}
          <div className="glass-card rounded-2xl p-6 shadow-lg space-y-5 lg:col-span-1">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-white/10 pb-2">Technical Core</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Response Latency
              </span>
              <span className="text-xs font-bold text-white">{scan.crawlData?.mainPage?.loadTimeMs || 0} ms</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-slate-400" />
                Document Size
              </span>
              <span className="text-xs font-bold text-white">{scan.crawlData?.mainPage?.pageSizeKb || 0} KB</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                SSL HTTPS Cert
              </span>
              <span className="text-xs font-extrabold text-emerald-400 uppercase">Secure</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Robots Index Rules</span>
              <span className="text-xs font-bold text-slate-300">{scan.crawlData?.mainPage?.meta?.robots || 'Not set'}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs text-slate-300 font-semibold">Structured JSON-LD</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                scan.crawlData?.mainPage?.structuredData.hasJsonLd ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>{scan.crawlData?.mainPage?.structuredData.hasJsonLd ? 'Discovered' : 'Missing'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Web Sitemap (.xml)</span>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  scan.crawlData?.sitemapFound ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>{scan.crawlData?.sitemapFound ? 'Discovered' : 'Missing'}</span>
                {scan.crawlData?.sitemapFound && scan.crawlData?.sitemapUrl && (
                  <a 
                    href={scan.crawlData.sitemapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
                  >
                    <span>View XML</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Crawler Nested Pages Discovery Output list */}
          <div className="glass-card rounded-2xl p-6 shadow-lg space-y-4 lg:col-span-2">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider border-b border-white/10 pb-2">
              Crawled Pages Hierarchy ({scan.mode === 'FULL_SITE' ? 'Full Site Mode' : 'Single Path Mode'})
            </h3>
            
            <div className="space-y-2.5">
              {/* Target root page */}
              <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/20">
                <div className="flex justify-between items-center text-xs font-bold text-white break-all">
                  <span>🏠 {scan.crawlData?.rootUrl || scan.url}</span>
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">Root Page</span>
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400 font-semibold mt-1">
                  <span>H1: {scan.crawlData?.mainPage?.headings?.h1.length || 0} headings</span>
                  <span>Images: {scan.crawlData?.mainPage?.images?.total || 0} media assets</span>
                </div>
              </div>

              {/* Subpages recursively indexed list */}
              {scan.crawlData?.additionalPages && scan.crawlData.additionalPages.length > 0 ? (
                scan.crawlData.additionalPages.map((sub, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs text-slate-250">
                    <div className="flex justify-between items-center font-bold text-slate-200 break-all">
                      <span>🔗 {sub.url}</span>
                      <span className="text-[10px] font-mono text-slate-400">{sub.loadTimeMs}ms</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-400 font-semibold mt-1">
                      <span>H1: {sub.headings.h1.length || 0}</span>
                      <span>Images: {sub.images.total}</span>
                      <span>Links: {sub.links.total} hrefs</span>
                    </div>
                  </div>
                ))
              ) : (
                scan.mode === 'FULL_SITE' && (
                  <div className="text-center font-semibold text-slate-450 text-xs py-5">
                    No secondary sublinks crawled. Depth checks didn't return additional paths.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEMANTIC ACCORDION HEADER TAGS & IMAGES LIST */}
      {settings.enabledSections.includes('content') && (
        <div className="glass-card rounded-2xl shadow-lg overflow-hidden" id="accordion-media">
          {/* Heading checklist audit toggling */}
          <div className="border-b border-white/10 p-6">
            <button
              onClick={() => setExpandedHeadings(!expandedHeadings)}
              className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer select-none"
            >
              <div>
                <h3 className="font-bold text-white text-sm">Semantic Heading Tag Matrix</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Dissect structure and keywords mapped in tags.</p>
              </div>
              <div className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                <span>Total Heading Tags ({scan.crawlData?.mainPage?.headings?.h1?.length || 0} H1, {scan.crawlData?.mainPage?.headings?.h2?.length || 0} H2)</span>
                {expandedHeadings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {expandedHeadings && (
              <div className="mt-6 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-455 uppercase font-black block mb-2">H1 Tags</span>
                    {scan.crawlData?.mainPage?.headings?.h1.map((tag, i) => (
                      <div key={i} className="text-xs text-slate-300 font-semibold mt-1 py-1.5 border-b border-white/5 last:border-b-0 break-all">{tag}</div>
                    )) || <span className="text-xs text-slate-400">None detected</span>}
                  </div>
                  <div className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-455 uppercase font-black block mb-2">H2 Tags</span>
                    {scan.crawlData?.mainPage?.headings?.h2.slice(0, 8).map((tag, i) => (
                      <div key={i} className="text-xs text-slate-300 font-semibold mt-1 py-1.5 border-b border-white/5 last:border-b-0 break-all">{tag}</div>
                    )) || <span className="text-xs text-slate-400">None detected</span>}
                  </div>
                  <div className="bg-black/20 p-3.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-455 uppercase font-black block mb-2">H3 Tags</span>
                    {scan.crawlData?.mainPage?.headings?.h3.slice(0, 8).map((tag, i) => (
                      <div key={i} className="text-xs text-slate-300 font-semibold mt-1 py-1.5 border-b border-white/5 last:border-b-0 break-all">{tag}</div>
                    )) || <span className="text-xs text-slate-400">None detected</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image assets checklist alt analyzer */}
          <div className="p-6">
            <button
              onClick={() => setExpandedLinks(!expandedLinks)}
              className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer select-none"
            >
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <ImageIcon className="text-slate-400 h-4 w-4" />
                  <span>Images Alternative Attributes Review</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Analyzing Alt descriptions (vital for Google Image Search rankings).</p>
              </div>
              <div className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                <span className="text-red-400 font-bold">{scan.crawlData?.mainPage?.images?.missingAlt || 0} of {scan.crawlData?.mainPage?.images?.total || 0} failing</span>
                {expandedLinks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {expandedLinks && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fadeIn">
                {scan.crawlData?.mainPage?.images?.list.map((img, i) => (
                  <div key={i} className={`p-3.5 rounded-xl border flex gap-3 text-xs items-center ${
                    img.hasAlt ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${img.hasAlt ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="space-y-0.5 truncate w-full">
                      <div className="font-mono text-[9px] truncate tracking-wider text-slate-400">{img.src}</div>
                      <div className="font-semibold italic truncate">Alt: "{img.hasAlt ? img.alt : 'Missing alt parameter'}"</div>
                    </div>
                  </div>
                )) || <span className="text-xs text-slate-400">No media assets detected on landing viewport.</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI SEARCH AEO OPTIMIZATION COMPLIANCE */}
      {settings.enabledSections.includes('aeo-geo') && (
        <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-400 to-indigo-500 opacity-60" />
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                GEO / AEO Standards v1.1
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-2 flex items-center gap-1.5">
                <Sparkles className="text-amber-400 h-5 w-5" />
                <span>Generative Search Grounding Review</span>
              </h3>
            </div>
            
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Reading compatibility</span>
              <span className="text-2xl font-black text-amber-400 mt-1">{aeoAssessment.generativeFriendlinessScore}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs text-slate-300">
            {/* Left AI column review */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Direct Answer Friendliness Assessment</span>
                <p className="mt-1 text-slate-205 leading-relaxed font-semibold">{aeoAssessment.directAnswerFriendliness}</p>
              </div>

              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Rich Snippet Schema Eligibility</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {aeoAssessment.richSnippetEligibility.map((sch, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-blue-200 uppercase font-black">{sch}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right target recommendation column */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Remediations to index in AI Assistants</span>
              <ul className="space-y-2">
                {aeoAssessment.recommendationsForAeo.map((rec, i) => (
                  <li key={i} className="flex items-start text-slate-200 font-medium">
                    <span className="mr-2 text-amber-400 font-bold select-none">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
