import React, { useEffect, useState } from 'react';
import { Users, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lead } from '../types';
import { downloadWithAuth } from '../download';

interface LeadsPanelProps {
  onOpenScan: (scanId: string) => void;
}

const PAGE_SIZE = 25;

export default function LeadsPanel({ onOpenScan }: LeadsPanelProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`/api/leads?page=${page}&limit=${PAGE_SIZE}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async res => {
        if (!res.ok) throw new Error('Could not load leads');
        const count = parseInt(res.headers.get('X-Total-Count') || '0', 10);
        const data: Lead[] = await res.json();
        if (!cancelled) { setLeads(data); setTotal(count); setError(''); }
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="glass-card rounded-2xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-slate-400" /> Captured leads ({total})
        </h3>
        <button
          onClick={() => downloadWithAuth('/api/scans/export?format=csv&leads=true', 'seo_leads.csv').catch(e => setError(e.message))}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">{error}</div>}

      {loading ? (
        <div className="text-xs text-slate-400 text-center py-8">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="text-xs text-slate-400 text-center py-8">
          No leads yet. Leads appear here when a visitor runs a scan from your embedded widget.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Site</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Critical</th>
                <th className="py-2">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr
                  key={l.scanId}
                  onClick={() => l.status === 'COMPLETED' && onOpenScan(l.scanId)}
                  className={`border-t border-white/5 ${l.status === 'COMPLETED' ? 'cursor-pointer hover:bg-white/5' : 'opacity-60'}`}
                >
                  <td className="py-2 pr-3 text-white font-semibold break-all">{l.email}</td>
                  <td className="py-2 pr-3 text-slate-300">{l.name || '—'}</td>
                  <td className="py-2 pr-3 text-slate-300 break-all">{l.url}</td>
                  <td className="py-2 pr-3 text-slate-200 font-bold">{l.overallScore ?? (l.status === 'PENDING' ? '…' : '—')}</td>
                  <td className="py-2 pr-3 text-slate-300">{l.criticalIssuesCount}</td>
                  <td className="py-2 text-slate-400 font-mono">{new Date(l.capturedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-slate-300">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
