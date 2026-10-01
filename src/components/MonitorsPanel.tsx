import React, { useEffect, useState } from 'react';
import { Activity, Trash2, Plus, Loader, Pause, Play, ExternalLink } from 'lucide-react';
import { Monitor, MonitorHistoryPoint, MonitorFrequency } from '../types';

interface MonitorsPanelProps {
  onOpenScan: (scanId: string) => void;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
}

// Inline SVG line chart of overall score over time. Simulated points (unreachable site,
// placeholder data) are drawn hollow and left out of the line.
function TrendChart({ points }: { points: MonitorHistoryPoint[] }) {
  const real = points.filter(p => p.overall !== null && !p.simulated);
  if (real.length < 2) {
    return (
      <div className="text-xs text-slate-400 text-center py-10">
        Need at least two completed scans to draw a trend. The first scan runs within a minute of adding a monitor.
      </div>
    );
  }
  const W = 560, H = 180, PAD = 28;
  const t0 = new Date(real[0].at).getTime();
  const t1 = new Date(real[real.length - 1].at).getTime();
  const span = Math.max(1, t1 - t0);
  const x = (p: MonitorHistoryPoint) => PAD + ((new Date(p.at).getTime() - t0) / span) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);
  const line = real.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)},${y(p.overall as number).toFixed(1)}`).join(' ');
  const simulated = points.filter(p => p.simulated && p.overall !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Overall score over time">
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" />
          <text x={4} y={y(v) + 3} fontSize="9" fill="#94a3b8">{v}</text>
        </g>
      ))}
      <path d={line} fill="none" stroke="#38bdf8" strokeWidth="2" />
      {real.map(p => (
        <circle key={p.scanId} cx={x(p)} cy={y(p.overall as number)} r="3.5" fill="#38bdf8">
          <title>{`${new Date(p.at).toLocaleString()} — ${p.overall}`}</title>
        </circle>
      ))}
      {simulated.map(p => (
        <circle key={p.scanId} cx={Math.min(W - PAD, Math.max(PAD, x(p)))} cy={y(p.overall as number)} r="3.5" fill="none" stroke="#f59e0b">
          <title>{`${new Date(p.at).toLocaleString()} — simulated data (site unreachable), excluded from the trend`}</title>
        </circle>
      ))}
      <text x={PAD} y={H - 6} fontSize="9" fill="#94a3b8">{new Date(t0).toLocaleDateString()}</text>
      <text x={W - PAD} y={H - 6} fontSize="9" fill="#94a3b8" textAnchor="end">{new Date(t1).toLocaleDateString()}</text>
    </svg>
  );
}

export default function MonitorsPanel({ onOpenScan }: MonitorsPanelProps) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState<MonitorFrequency>('WEEKLY');
  const [alertDrop, setAlertDrop] = useState(5);
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<MonitorHistoryPoint[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/monitors', { headers: authHeaders() });
      if (!res.ok) throw new Error('Could not load monitors');
      setMonitors(await res.json());
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedId) { setHistory([]); return; }
    let cancelled = false;
    fetch(`/api/monitors/${selectedId}/history`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (!cancelled) setHistory(data); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const addMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url, frequency, alertDrop })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not add monitor');
      setUrl('');
      await load();
      setSelectedId(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (m: Monitor) => {
    const res = await fetch(`/api/monitors/${m.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ active: !m.active })
    });
    if (!res.ok) setError('Could not update monitor');
    await load();
  };

  const remove = async (m: Monitor) => {
    if (!confirm(`Stop monitoring ${m.url}? Its past scans are kept.`)) return;
    const res = await fetch(`/api/monitors/${m.id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) setError('Could not delete monitor');
    if (selectedId === m.id) setSelectedId(null);
    await load();
  };

  const selected = monitors.find(m => m.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-6">
        <form onSubmit={addMonitor} className="glass-card rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-slate-400" /> Add monitor
          </h3>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="example.com"
            required
            disabled={adding}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Frequency
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as MonitorFrequency)}
                className="mt-1 w-full px-2.5 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white normal-case"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </label>
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Alert on drop of
              <input
                type="number" min={1} max={100}
                value={alertDrop}
                onChange={e => setAlertDrop(Number(e.target.value) || 1)}
                className="mt-1 w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {adding ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {adding ? 'Adding...' : 'Start monitoring'}
          </button>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Score-drop emails are configured in White-Label Presets (monitoring email + enable alerts). The server
            also needs <span className="font-mono">RESEND_API_KEY</span> and <span className="font-mono">EMAIL_FROM</span> set to actually send them.
          </p>
        </form>
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">{error}</div>}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest">Monitors ({monitors.length}/10)</h3>
          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Loading...</div>
          ) : monitors.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No monitors yet. Add a URL to re-scan it on a schedule.</div>
          ) : monitors.map(m => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(m.id)}
              onKeyDown={e => { if (e.key === 'Enter') setSelectedId(m.id); }}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                selectedId === m.id ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-white break-all">{m.url}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {m.frequency === 'DAILY' ? 'Daily' : 'Weekly'} · alert ≥{m.alertDrop} pts ·{' '}
                  {m.active ? `next ${new Date(m.nextRunAt).toLocaleString()}` : 'paused'}
                  {m.lastRunAt ? ` · last ${new Date(m.lastRunAt).toLocaleString()}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                  {m.latestScore !== null && m.latestScore !== undefined ? `${m.latestScore} Pts` : 'No score yet'}
                </span>
                {m.latestScanId && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onOpenScan(m.latestScanId as string); }}
                    className="p-1.5 rounded-md text-slate-400 hover:text-brand-300 hover:bg-white/10 cursor-pointer"
                    title="Open latest report"
                  ><ExternalLink className="h-3.5 w-3.5" /></button>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); toggleActive(m); }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  title={m.active ? 'Pause' : 'Resume'}
                >{m.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); remove(m); }}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  title="Delete monitor"
                ><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-lg">
          <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest mb-3">
            Score trend{selected ? ` — ${selected.url}` : ''}
          </h3>
          {selected ? <TrendChart points={history} /> : (
            <div className="text-xs text-slate-400 text-center py-10">Select a monitor to see its score history.</div>
          )}
        </div>
      </div>
    </div>
  );
}
