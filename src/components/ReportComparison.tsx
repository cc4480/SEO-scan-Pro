import React from 'react';
import { Scan } from '../types';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';

interface ReportComparisonProps {
  currentScan: Scan;
  historyScans: Scan[];
  onSelectCompareScan: (compareId: string) => void;
  selectedCompareScan?: Scan;
}

export default function ReportComparison({ currentScan, historyScans, onSelectCompareScan, selectedCompareScan }: ReportComparisonProps) {
  // Filter other scans of the same domain name to offer choices to compare
  const currentHost = new URL(currentScan.url).hostname;
  
  const eligibleScans = historyScans.filter(s => 
    s.id !== currentScan.id && 
    s.status === 'COMPLETED' &&
    new URL(s.url).hostname === currentHost
  );

  // If nothing is explicitly selected to compare against, auto-default to the most recent
  // eligible scan of the same domain.
  const eligibleCount = eligibleScans.length;
  const currentScanId = currentScan.id;
  const selectedCompareScanId = selectedCompareScan?.id;

  React.useEffect(() => {
    if (!selectedCompareScanId && eligibleCount > 0) {
      onSelectCompareScan(eligibleScans[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScanId, selectedCompareScanId, eligibleCount]);

  if (eligibleScans.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 md:p-8 text-center shadow-lg">
        <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-white text-sm">No Audit History Found</h3>
        <p className="text-xs text-slate-400 mt-1">
          Scans must target the same domain (e.g. {currentHost}) multiple times to generate chronological progress tracking charts.
        </p>
      </div>
    );
  }

  const baseScan = selectedCompareScan || eligibleScans[0];
  if (!baseScan || !baseScan.seoReport || !currentScan.seoReport) {
    return (
      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <span className="text-xs font-bold text-slate-400">Loading historical audit profiles...</span>
      </div>
    );
  }

  const scoreDiff = currentScan.seoReport.score.overall - baseScan.seoReport.score.overall;
  const techDiff = currentScan.seoReport.score.technical - baseScan.seoReport.score.technical;
  const aeoDiff = currentScan.seoReport.score.aeoGeo - baseScan.seoReport.score.aeoGeo;
  const speedDiff = (currentScan.crawlData?.mainPage?.loadTimeMs || 0) - (baseScan.crawlData?.mainPage?.loadTimeMs || 0);

  const formatDelta = (num: number, invert = false) => {
    if (num === 0) return <span className="text-xs text-slate-405 font-bold select-none">No Change</span>;
    const isWorse = invert ? num > 0 : num < 0;
    const displayNum = num > 0 ? `+${num}` : num;
    
    if (isWorse) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-550/20 border border-red-500/20 rounded text-red-300 text-[10px] font-bold">
          <ArrowDownRight className="h-3 w-3" />
          <span>{displayNum}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/20 rounded text-emerald-300 text-[10px] font-bold">
        <ArrowUpRight className="h-3 w-3" />
        <span>{displayNum}</span>
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald-400 h-5 w-5" />
            <span>SEO Chronological Progress Tracking</span>
          </h2>
          <p className="text-xs text-slate-405 mt-1">
            Comparing your active scan against previous reports to outline SEO improvements.
          </p>
        </div>

        {/* Dropdown chooser */}
        <div className="flex items-center gap-2">
          <Calendar className="text-slate-400 h-4 w-4" />
          <select
            value={baseScan.id}
            onChange={(e) => onSelectCompareScan(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-205 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {eligibleScans.map(s => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {new Date(s.createdAt).toLocaleDateString()} ({s.seoReport?.score.overall} Pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delta Overview Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Overall SEO Gain</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-black text-white">{currentScan.seoReport.score.overall} pts</span>
            {formatDelta(scoreDiff)}
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Technical Crawl</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-white">{currentScan.seoReport.score.technical}%</span>
            {formatDelta(techDiff)}
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AEO / AI Prompts</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-white">{currentScan.seoReport.score.aeoGeo}%</span>
            {formatDelta(aeoDiff)}
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Response Loading Time</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-bold text-white">{currentScan.crawlData?.mainPage?.loadTimeMs || 0}ms</span>
            {formatDelta(speedDiff, true)}
          </div>
        </div>
      </div>

      {/* Side-by-side Progress Metrics Slider Bars */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visual Progression Metrics</h3>
        
        {[
          { label: 'Overall SEO Score', base: baseScan.seoReport.score.overall, cur: currentScan.seoReport.score.overall },
          { label: 'Technical Score', base: baseScan.seoReport.score.technical, cur: currentScan.seoReport.score.technical },
          { label: 'Content Optimization', base: baseScan.seoReport.score.content, cur: currentScan.seoReport.score.content },
          { label: 'AEO / GEO Index Score', base: baseScan.seoReport.score.aeoGeo, cur: currentScan.seoReport.score.aeoGeo }
        ].map((item, i) => (
          <div key={i} className="space-y-1.5 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="text-[11px]">{item.label}</span>
              <span className="text-[10px] flex gap-2">
                <span className="text-slate-400">Previous: {item.base}</span>
                <span className="text-blue-400">Current: {item.cur}</span>
              </span>
            </div>
            
            {/* Split Comparison Range Bars */}
            <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-slate-500 rounded-full transition-all opacity-[0.4]" 
                style={{ width: `${item.base}%` }}
              />
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                  item.cur >= item.base ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.cur}%`, opacity: 0.8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
