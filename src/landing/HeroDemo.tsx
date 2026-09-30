import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Bot, Check, Globe, ShieldCheck, TriangleAlert } from 'lucide-react';
import { AUDIT_CHECKS } from '../auditChecks';
import { ScoreRing } from './Reveal';
import { prefersReducedMotion } from './motionKit';

const EASE = [0.16, 1, 0.3, 1] as const;
const URL_TEXT = 'yourwebsite.com';
const SCAN_STAGES = AUDIT_CHECKS.slice(0, 9);

const BARS = [
  { label: 'Technical', value: 91 },
  { label: 'Content', value: 84 },
  { label: 'AEO / GEO', value: 72 },
  { label: 'Performance', value: 93 }
];
const FINDINGS = [
  { tone: 'text-rose-300 bg-rose-400/10 border-rose-400/30', tag: 'High', text: 'No llms.txt — AI crawlers get no guidance' },
  { tone: 'text-amber-300 bg-amber-400/10 border-amber-400/30', tag: 'Medium', text: '7 images missing alt text' },
  { tone: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30', tag: 'Pass', text: 'Structured data: Organization, FAQPage' }
];

type Phase = 'typing' | 'scanning' | 'results';

/**
 * Self-playing product demo: a URL types itself, the audit runs stage by stage under a sweeping
 * beam, then the scores count up. It loops. Illustrative only — labelled "Sample report".
 */
export default function HeroDemo() {
  const still = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(still ? 'results' : 'typing');
  const [typed, setTyped] = useState(still ? URL_TEXT : '');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (still) return;
    let timer: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
    if (phase === 'typing') {
      let i = 0;
      timer = setInterval(() => {
        i += 1;
        setTyped(URL_TEXT.slice(0, i));
        if (i >= URL_TEXT.length) { clearInterval(timer); timer = setTimeout(() => { setStage(0); setPhase('scanning'); }, 550); }
      }, 85);
    } else if (phase === 'scanning') {
      timer = setInterval(() => {
        setStage((s) => {
          if (s + 1 >= SCAN_STAGES.length) { clearInterval(timer); timer = setTimeout(() => setPhase('results'), 450); return SCAN_STAGES.length; }
          return s + 1;
        });
      }, 300);
    } else {
      timer = setTimeout(() => { setTyped(''); setPhase('typing'); }, 6500);
    }
    return () => { clearTimeout(timer as ReturnType<typeof setTimeout>); clearInterval(timer as ReturnType<typeof setInterval>); };
  }, [phase, still]);

  // 3D tilt toward the cursor, with a moving glare.
  const mx = useMotionValue(0.5), my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 140, damping: 16 });
  const ry = useSpring(useTransform(mx, [0, 1], [-11, 11]), { stiffness: 140, damping: 16 });
  const glare = useTransform([mx, my] as any, ([x, y]: number[]) => `radial-gradient(420px circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.13), transparent 60%)`);

  const scanning = phase === 'scanning';

  return (
    <div
      className="relative mx-auto w-full max-w-md"
      style={{ perspective: 1100 }}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height); }}
      onPointerLeave={() => { mx.set(0.5); my.set(0.5); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 14 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
      >
        <motion.div
          style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className="glass-panel relative overflow-hidden rounded-3xl p-5 shadow-2xl shadow-blue-950/60"
        >
          <motion.div className="pointer-events-none absolute inset-0 z-20" style={{ background: glare }} aria-hidden />
          {scanning && (
            <motion.div
              aria-hidden className="pointer-events-none absolute inset-x-0 z-10 h-24"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(52,211,153,0.22), transparent)' }}
              initial={{ top: '12%' }} animate={{ top: '92%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${scanning ? 'bg-amber-300 animate-pulse' : 'bg-emerald-400'}`} />{scanning ? 'auditing…' : phase === 'results' ? 'audit complete' : 'ready'}</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase tracking-widest text-[9px]">Sample report</span>
          </div>

          {/* URL bar */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
            <Globe className="h-4 w-4 shrink-0 text-sky-300" />
            <span className="flex-1 truncate font-mono text-sm text-slate-100">
              https://{typed}
              {phase === 'typing' && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-emerald-300 animate-pulse" />}
            </span>
            <motion.span
              animate={phase === 'typing' && typed.length === URL_TEXT.length ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-[11px] font-bold text-white"
            >
              Scan
            </motion.span>
          </div>

          <div className="relative mt-4 h-[292px]">
            <AnimatePresence mode="wait">
              {phase !== 'results' ? (
                <motion.ul
                  key="scan" className="space-y-1.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                >
                  {SCAN_STAGES.map((s, i) => {
                    const done = phase === 'scanning' && i < stage;
                    const running = phase === 'scanning' && i === stage;
                    const Icon = s.Icon;
                    return (
                      <li key={s.id} className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-300 ${running ? 'border-white/25 bg-white/[0.07]' : done ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-white/5'}`} style={{ opacity: phase === 'typing' ? 0.35 : done || running ? 1 : 0.4 }}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                          {done ? <Check className="h-3 w-3" /> : <Icon className={`h-3 w-3 ${running ? 'animate-pulse text-white' : ''}`} />}
                        </span>
                        <span className="flex-1 truncate text-slate-200">{s.label}</span>
                        {running && <span className="text-[10px] text-emerald-300 animate-pulse">running</span>}
                      </li>
                    );
                  })}
                </motion.ul>
              ) : (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="flex items-center gap-5">
                    <ScoreRing value={87} label="Overall" size={116} stroke={8} />
                    <div className="flex-1 space-y-2.5">
                      {BARS.map((b, i) => (
                        <div key={b.label}>
                          <div className="flex justify-between text-[11px] text-slate-300"><span>{b.label}</span><span className="tabular-nums text-slate-400">{b.value}</span></div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" initial={{ width: 0 }} animate={{ width: `${b.value}%` }} transition={{ duration: 1.1, delay: 0.2 + i * 0.12, ease: EASE }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {FINDINGS.map((f, i) => (
                      <motion.li key={f.text} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.7 + i * 0.15, ease: EASE }} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${f.tone}`}>{f.tag}</span>
                        <span className="truncate">{f.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating chips (decorative), lifted off the card in 3D */}
      <motion.div aria-hidden initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }} transition={{ opacity: { delay: 1.6 }, scale: { delay: 1.6 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }} className="hidden sm:flex absolute -left-10 -bottom-9 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl">
        <Bot className="h-4 w-4 text-fuchsia-300" /> AI-search ready
      </motion.div>
      <motion.div aria-hidden initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, 9, 0] }} transition={{ opacity: { delay: 1.8 }, scale: { delay: 1.8 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }} className="hidden sm:flex absolute -right-8 -bottom-12 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl">
        <ShieldCheck className="h-4 w-4 text-emerald-300" /> Security headers checked
      </motion.div>
      <motion.div aria-hidden initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }} transition={{ opacity: { delay: 2 }, scale: { delay: 2 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }} className="hidden md:flex absolute right-8 -top-5 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl">
        <TriangleAlert className="h-4 w-4 text-amber-300" /> 3 fixes to ship
      </motion.div>
    </div>
  );
}
