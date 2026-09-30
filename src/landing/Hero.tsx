import { motion } from 'motion/react';
import { ArrowRight, Bot, ShieldCheck, TriangleAlert } from 'lucide-react';
import { ScoreRing } from './Reveal';

const EASE = [0.16, 1, 0.3, 1] as const;

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

// A decorative sample of what a finished report looks like. It is labelled as a sample and is not
// tied to any real scan.
function SampleReport() {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 32, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.25, ease: EASE }}
        className="glass-panel rounded-3xl p-6 shadow-2xl shadow-blue-950/50 w-full max-w-md mx-auto"
      >
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> example.com</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 uppercase tracking-widest text-[9px]">Sample report</span>
        </div>

        <div className="mt-5 flex items-center gap-6">
          <ScoreRing value={87} label="Overall" />
          <div className="flex-1 space-y-3">
            {BARS.map((b, i) => (
              <div key={b.label}>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{b.label}</span>
                  <span className="tabular-nums text-slate-400">{b.value}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                    initial={{ width: 0 }} animate={{ width: `${b.value}%` }}
                    transition={{ duration: 1.1, delay: 0.7 + i * 0.12, ease: EASE }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {FINDINGS.map((f, i) => (
            <motion.li
              key={f.text}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.15, ease: EASE }}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200"
            >
              <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${f.tone}`}>{f.tag}</span>
              <span className="truncate">{f.text}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Floating chips (decorative) */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 1.4 }, scale: { delay: 1.4 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="hidden sm:flex absolute -left-8 -bottom-4 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl"
      >
        <Bot className="h-4 w-4 text-fuchsia-300" /> AI-search ready
      </motion.div>
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 1.6 }, scale: { delay: 1.6 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}
        className="hidden sm:flex absolute -right-6 -bottom-6 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-300" /> Security headers checked
      </motion.div>
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8 }}
        className="hidden md:flex absolute right-8 -top-5 items-center gap-2 rounded-xl glass-panel px-3 py-2 text-xs text-slate-200 shadow-xl"
      >
        <TriangleAlert className="h-4 w-4 text-amber-300" /> 3 fixes to ship
      </motion.div>
    </div>
  );
}

export default function Hero({ onGetStarted, onSeeHow }: { onGetStarted: () => void; onSeeHow: () => void }) {
  return (
    <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden">
      <div className="landing-grid absolute inset-0" aria-hidden />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full bg-blue-600/25 blur-[140px]" aria-hidden />
      <div className="absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[120px]" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SEO + AI-search (AEO/GEO) audits in one scan
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05] text-balance"
          >
            Find out why your site isn&rsquo;t ranking{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-300 bg-clip-text text-transparent">in Google or AI search.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
            className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed"
          >
            SEO Scan Pro loads your site in a real browser, runs 13 audit stages across technical SEO, content, AI-answer readiness,
            security and speed, then hands you a branded report and a ready-made prompt for your coding agent.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.28, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <button
              type="button" onClick={onGetStarted}
              className="group inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-500/50 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Run my first audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button" onClick={onSeeHow}
              className="inline-flex min-h-[48px] items-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              See how it works
            </button>
          </motion.div>
          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"
          >
            <li>Real-browser rendering</li>
            <li>Live, event-by-event audit log</li>
            <li>White-label PDF reports</li>
          </motion.ul>
        </div>
        <SampleReport />
      </div>
    </section>
  );
}
