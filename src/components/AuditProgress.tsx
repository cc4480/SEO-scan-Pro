import { useEffect, useMemo, useRef, useState } from 'react';
import { AUDIT_CHECKS, type AuditTag } from '../auditChecks';
import type { ProgressEvent, ProgressLevel } from '../types';

interface AuditProgressProps {
  /** Real events streamed from the server while the scan runs (or the saved log of a finished one). */
  events: ProgressEvent[];
  /** The URL being audited, shown in the command line. */
  target?: string;
  /** True for a completed scan's saved log: no spinner, no live clock. */
  finished?: boolean;
  /** Height cap of the scrolling log. */
  maxHeightClass?: string;
}

// Static class strings (Tailwind can only see complete literals), one colour per log channel.
const TAG_STYLE: Record<AuditTag, { tag: string; glow: string }> = {
  NET:   { tag: 'text-sky-400',     glow: 'bg-sky-400/10 border-sky-400/30' },
  CRAWL: { tag: 'text-cyan-300',    glow: 'bg-cyan-300/10 border-cyan-300/30' },
  PARSE: { tag: 'text-violet-400',  glow: 'bg-violet-400/10 border-violet-400/30' },
  SEO:   { tag: 'text-amber-300',   glow: 'bg-amber-300/10 border-amber-300/30' },
  AEO:   { tag: 'text-fuchsia-400', glow: 'bg-fuchsia-400/10 border-fuchsia-400/30' },
  SEC:   { tag: 'text-rose-400',    glow: 'bg-rose-400/10 border-rose-400/30' },
  PERF:  { tag: 'text-orange-400',  glow: 'bg-orange-400/10 border-orange-400/30' },
  AI:    { tag: 'text-emerald-400', glow: 'bg-emerald-400/10 border-emerald-400/30' }
};

const LEVEL_STYLE: Record<ProgressLevel, { glyph: string; text: string }> = {
  start: { glyph: '›', text: 'text-slate-500' },
  info:  { glyph: '·', text: 'text-slate-400' },
  ok:    { glyph: '✓', text: 'text-emerald-300' },
  warn:  { glyph: '▲', text: 'text-amber-300' },
  fail:  { glyph: '✗', text: 'text-rose-400' },
  done:  { glyph: '', text: '' }
};

type StageState = 'pending' | 'running' | 'ok' | 'warn' | 'fail';

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const stamp = (ms: number) => `+${(ms / 1000).toFixed(2)}s`;

/**
 * The audit log, styled as a terminal. Every line is a real event the scanner emitted at the
 * moment it happened: a request it made, a value it measured, or a fallback it took. Stages with
 * no events yet are shown as waiting. Nothing here is scripted, estimated or timer-driven.
 */
export default function AuditProgress({ events, target, finished = false, maxHeightClass = 'max-h-[28rem]' }: AuditProgressProps) {
  const grouped = useMemo(() => {
    const byStage = new Map<string, ProgressEvent[]>();
    for (const e of events) {
      const list = byStage.get(e.stage);
      if (list) list.push(e);
      else byStage.set(e.stage, [e]);
    }
    return byStage;
  }, [events]);

  const stageState = (id: string): { state: StageState; summary: string } => {
    const list = grouped.get(id);
    if (!list || list.length === 0) return { state: 'pending', summary: '' };
    const doneEvent = list.find((e) => e.level === 'done');
    const worst: StageState = list.some((e) => e.level === 'fail') ? 'fail' : list.some((e) => e.level === 'warn') ? 'warn' : 'ok';
    if (!doneEvent) return { state: finished ? worst : 'running', summary: '' };
    return { state: worst, summary: doneEvent.msg };
  };

  const states = AUDIT_CHECKS.map((c) => stageState(c.id));
  const total = AUDIT_CHECKS.length;
  const completed = states.filter((s) => s.state !== 'pending' && s.state !== 'running').length;
  const lifecycle = grouped.get('scan') ?? [];
  const scanEnded = finished || lifecycle.some((e) => (e.level === 'ok' || e.level === 'warn' || e.level === 'fail') && /audit finished|aborted/.test(e.msg));
  const failed = lifecycle.some((e) => e.level === 'fail');
  const pct = scanEnded && !failed ? 100 : Math.round((completed / total) * 100);

  // Elapsed clock: live while running, fixed to the last event once the scan has ended.
  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (scanEnded) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [scanEnded]);
  const elapsed = scanEnded ? (events.length ? events[events.length - 1].t : 0) : now - startRef.current;

  // Follow new lines unless the reader scrolled up to look at something.
  const bodyRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  useEffect(() => {
    // A saved log opens at the top (you read it from the start); only the live view follows along.
    if (finished) return;
    const body = bodyRef.current;
    if (body && stickRef.current) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }, [events.length, finished]);

  const host = (target || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '') || 'target';

  return (
    <div
      className="rounded-xl overflow-hidden border border-emerald-400/20 shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)] animate-fadeIn font-mono"
      style={{ backgroundColor: '#070b12' }}
      role="log"
      aria-live="polite"
      aria-label={scanEnded ? 'Audit log' : `Audit running, ${completed} of ${total} checks done`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10" style={{ backgroundColor: '#0d1420' }}>
        <span className="flex gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </span>
        <span className="flex-1 min-w-0 text-center text-[10px] text-slate-500 truncate">seoscan — live audit log</span>
        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{scanEnded ? clock(elapsed) : clock(elapsed)}</span>
      </div>

      <div className="px-3 pt-3 pb-2 text-[11px] leading-relaxed">
        <div className="text-slate-300 break-all">
          <span className="text-emerald-400">➜</span> <span className="text-cyan-300">~</span>{' '}
          <span className="text-slate-500">$</span> seoscan audit <span className="text-amber-300">--target</span>{' '}
          <span className="text-sky-300">{host}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 tabular-nums">
          <span className="relative h-1.5 flex-1 max-w-[9rem] rounded-full bg-white/10 overflow-hidden" aria-hidden>
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: failed ? '#fb7185' : scanEnded ? '#34d399' : 'linear-gradient(90deg, #22d3ee, #34d399)',
                boxShadow: '0 0 8px rgba(52,211,153,0.5)'
              }}
            />
          </span>
          <span className={`text-[10px] font-bold ${failed ? 'text-rose-400' : scanEnded ? 'text-emerald-400' : 'text-slate-300'}`}>{pct}%</span>
          <span className="text-[10px] text-slate-500 ml-auto">
            {completed}/{total} stages
          </span>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={bodyRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className={`px-3 pb-3 ${maxHeightClass} overflow-y-auto text-[11px] leading-relaxed`}
      >
        {events.length === 0 && (
          <div className="text-slate-500 py-2">
            <span className="text-emerald-400">➜</span> waiting for the first event from the server
            <span className="text-emerald-400 animate-pulse"> ▌</span>
          </div>
        )}

        {/* Scan lifecycle lines that precede any stage (queueing) */}
        {lifecycle.length > 0 && (
          <div className="space-y-0.5 mb-1">
            {lifecycle.map((e) => (
              <LogLine key={e.i} e={e} />
            ))}
          </div>
        )}

        {AUDIT_CHECKS.map((check, idx) => {
          const { state, summary } = states[idx];
          if (state === 'pending' && events.length > 0 && scanEnded) return null; // never ran (aborted early)
          const list = (grouped.get(check.id) ?? []).filter((e) => e.level !== 'done');
          const style = TAG_STYLE[check.tag];
          const headColour =
            state === 'fail' ? 'text-rose-300' : state === 'warn' ? 'text-amber-200' : state === 'ok' ? 'text-slate-200' : state === 'running' ? 'text-white font-semibold' : 'text-slate-600';

          return (
            <div
              key={check.id}
              className={`mt-1 rounded-md border px-2 py-1 transition-colors duration-300 ${state === 'running' ? style.glow : 'border-transparent'}`}
            >
              <div className="flex items-start gap-2">
                <span className="w-3 shrink-0 text-center" aria-hidden>
                  {state === 'ok' && <span className="text-emerald-400">✓</span>}
                  {state === 'warn' && <span className="text-amber-300">▲</span>}
                  {state === 'fail' && <span className="text-rose-400">✗</span>}
                  {state === 'running' && (
                    <span className={`${style.tag} inline-block animate-spin`} style={{ animationDuration: '1.2s' }}>◜</span>
                  )}
                  {state === 'pending' && <span className="text-slate-700">○</span>}
                </span>
                <span className={`shrink-0 text-[10px] font-bold w-[3.4rem] ${state === 'pending' ? 'text-slate-600' : style.tag}`}>[{check.tag}]</span>
                <span className={`flex-1 min-w-0 ${headColour}`}>{check.label}</span>
                <span className="shrink-0 text-[10px] text-right max-w-[38%] truncate">
                  {state === 'running' ? (
                    <span className={`${style.tag} animate-pulse`}>running</span>
                  ) : state === 'pending' ? (
                    <span className="text-slate-700">waiting</span>
                  ) : (
                    <span className={state === 'fail' ? 'text-rose-400/90' : state === 'warn' ? 'text-amber-300/90' : 'text-emerald-400/80'}>{summary}</span>
                  )}
                </span>
              </div>

              {list.length > 0 && (
                <div className="mt-0.5 ml-[1.1rem] pl-2.5 border-l border-white/10 space-y-0.5">
                  {list.map((e) => (
                    <LogLine key={e.i} e={e} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-3 pt-2 border-t border-white/5 text-slate-400">
          {scanEnded ? (
            failed ? (
              <span>
                <span className="text-rose-400">✗</span> audit aborted <span className="text-slate-600">— see the last lines above</span>
              </span>
            ) : (
              <span>
                <span className="text-emerald-400">✔</span> audit finished <span className="text-slate-600">— {events.length} events logged</span>
              </span>
            )
          ) : (
            <span>
              <span className="text-emerald-400">➜</span> <span className="text-slate-500">$</span>{' '}
              <span className="text-slate-500">working</span>
              <span className="text-emerald-400 animate-pulse"> ▌</span>
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 border-t border-white/10 text-[9px]" style={{ backgroundColor: '#0d1420' }}>
        {(Object.keys(TAG_STYLE) as AuditTag[]).map((t) => (
          <span key={t} className={TAG_STYLE[t].tag}>● {t}</span>
        ))}
        <span className="ml-auto text-slate-500">
          <span className="text-emerald-300">✓</span> ok <span className="text-amber-300">▲</span> issue <span className="text-rose-400">✗</span> failed
        </span>
      </div>
    </div>
  );
}

// `key` is declared because the project has no @types/react, so JSX props are checked literally.
function LogLine({ e }: { e: ProgressEvent; key?: string | number }) {
  const lv = LEVEL_STYLE[e.level] ?? LEVEL_STYLE.info;
  return (
    <div className="flex gap-2 animate-fadeIn">
      <span className="shrink-0 text-slate-600 tabular-nums w-[3.6rem]">{stamp(e.t)}</span>
      <span className={`shrink-0 w-2.5 text-center ${lv.text}`}>{lv.glyph}</span>
      <span className={`min-w-0 break-words ${lv.text}`}>{e.msg}</span>
    </div>
  );
}
