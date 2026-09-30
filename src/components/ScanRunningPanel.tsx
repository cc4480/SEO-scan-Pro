import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Check, AlertTriangle, X } from 'lucide-react';
import type { ProgressEvent } from '../types';
import { buildAuditModel, type StageState } from '../auditProgressModel';
import type { AuditTag } from '../auditChecks';

const TAG_COLOUR: Record<AuditTag, string> = {
  NET: '#38bdf8', CRAWL: '#67e8f9', PARSE: '#a78bfa', SEO: '#fcd34d',
  AEO: '#e879f9', SEC: '#fb7185', PERF: '#fb923c', AI: '#34d399'
};
// Complete class literals so Tailwind can see them.
const STATE_RING: Record<StageState, string> = {
  pending: 'border-white/10 text-slate-600',
  running: 'border-white/30 text-white',
  ok: 'border-emerald-400/40 text-emerald-300',
  warn: 'border-amber-400/40 text-amber-300',
  fail: 'border-rose-400/40 text-rose-300'
};

const RADIUS = 92;
const CIRC = 2 * Math.PI * RADIUS;

// Counts smoothly to the target instead of jumping between steps.
function AnimatedPercent({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const text = useTransform(spring, (v) => `${Math.round(v)}`);
  useEffect(() => { mv.set(value); }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/**
 * Full-width "audit in progress" view. Everything here is derived from the real events the
 * scanner emits (see buildAuditModel): the radar's blips are stages that have actually started,
 * the percentage is stages completed over stages total, and the headline is the latest event.
 */
export default function ScanRunningPanel({ events, target }: { events: ProgressEvent[]; target?: string }) {
  const model = useMemo(() => buildAuditModel(events), [events]);
  const current = model.current >= 0 ? model.stages[model.current] : null;
  const last = events.length ? events[events.length - 1] : null;
  const host = (target || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '') || 'your site';

  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const secs = Math.floor((now - startRef.current) / 1000);

  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden" role="status" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
      <div className="grid gap-8 md:grid-cols-[220px_1fr] items-center">
        {/* Radar */}
        <div className="relative mx-auto h-[220px] w-[220px] shrink-0">
          <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="scanRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="scanSweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {[30, 60].map((r) => (
              <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray="2 5" />
            ))}
            <line x1="110" y1="14" x2="110" y2="206" stroke="rgba(255,255,255,0.05)" />
            <line x1="14" y1="110" x2="206" y2="110" stroke="rgba(255,255,255,0.05)" />
            {/* Progress ring */}
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <motion.circle
              cx="110" cy="110" r={RADIUS} fill="none" stroke="url(#scanRing)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={CIRC} transform="rotate(-90 110 110)"
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: CIRC * (1 - model.pct / 100) }}
              transition={{ type: 'spring', stiffness: 60, damping: 18 }}
            />
            {/* Rotating sweep */}
            {!model.ended && (
              <g className="radar-sweep" style={{ transformOrigin: '110px 110px' }}>
                <path d="M110 110 L110 24 A86 86 0 0 1 184 67 Z" fill="url(#scanSweep)" />
                <line x1="110" y1="110" x2="110" y2="24" stroke="#34d399" strokeOpacity="0.8" strokeWidth="1.5" />
              </g>
            )}
            {/* One blip per stage that has started, placed around the dial */}
            {model.stages.map((s, i) => {
              if (s.state === 'pending') return null;
              const a = (i / model.total) * Math.PI * 2 - Math.PI / 2;
              const r = 46 + ((i * 37) % 40);
              const x = 110 + Math.cos(a) * r;
              const y = 110 + Math.sin(a) * r;
              const colour = s.state === 'fail' ? '#fb7185' : s.state === 'warn' ? '#fbbf24' : TAG_COLOUR[s.check.tag];
              return (
                <g key={s.check.id}>
                  {s.state === 'running' && (
                    <motion.circle
                      cx={x} cy={y} fill="none" stroke={colour}
                      initial={{ r: 4, opacity: 0.9 }} animate={{ r: 16, opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <motion.circle
                    cx={x} cy={y} r="3.5" fill={colour}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                    style={{ transformOrigin: `${x}px ${y}px`, filter: `drop-shadow(0 0 5px ${colour})` }}
                  />
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-4xl font-extrabold tabular-nums text-white">
              <AnimatedPercent value={model.pct} /><span className="text-xl text-slate-400">%</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {model.completed}/{model.total} stages
            </div>
          </div>
        </div>

        {/* Headline + stage grid */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Audit in progress · {String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-white tracking-tight break-words">Auditing {host}</h2>
          <div className="mt-1 h-6 text-sm text-slate-300 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={last?.i ?? 'wait'}
                initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.22 }} className="truncate"
              >
                {last ? last.msg : current ? current.check.label : 'Waiting for the first event from the server…'}
              </motion.p>
            </AnimatePresence>
          </div>

          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {model.stages.map((s, i) => {
              const Icon = s.check.Icon;
              return (
                <motion.li
                  key={s.check.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-2 text-xs transition-colors duration-300 overflow-hidden ${STATE_RING[s.state]} ${s.state === 'running' ? 'bg-white/[0.06]' : 'bg-white/[0.02]'}`}
                >
                  {s.state === 'running' && <span className="stage-shimmer absolute inset-0" aria-hidden />}
                  <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    {s.state === 'ok' ? <Check className="h-3.5 w-3.5" /> :
                     s.state === 'warn' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                     s.state === 'fail' ? <X className="h-3.5 w-3.5" /> :
                     <Icon className={`h-3.5 w-3.5 ${s.state === 'running' ? 'animate-pulse' : ''}`} />}
                  </span>
                  <span className={`relative min-w-0 flex-1 truncate ${s.state === 'pending' ? 'text-slate-500' : 'text-slate-100'}`}>{s.check.label}</span>
                  <span className="relative shrink-0 font-mono text-[9px]" style={{ color: s.state === 'pending' ? undefined : TAG_COLOUR[s.check.tag] }}>{s.check.tag}</span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
