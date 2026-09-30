import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { Check } from 'lucide-react';
import { AUDIT_CHECKS, type AuditTag } from '../auditChecks';
import { ScoreRing } from './Reveal';

const TAG_COLOUR: Record<AuditTag, string> = {
  NET: '#38bdf8', CRAWL: '#67e8f9', PARSE: '#a78bfa', SEO: '#fcd34d',
  AEO: '#e879f9', SEC: '#fb7185', PERF: '#fb923c', AI: '#34d399'
};

// Illustrative one-liners for each stage of an example run. Order matches AUDIT_CHECKS.
const EXAMPLE_RESULT: Record<string, string> = {
  url: 'Public address, HTTPS',
  robots: 'Sitemap found',
  llms: 'No llms.txt',
  render: 'Rendered after JavaScript',
  meta: 'Title and description present',
  headings: '1 H1, 6 H2, 1,240 words',
  images: '7 of 32 missing alt text',
  links: 'Sampled 20, 0 broken',
  schema: 'Organization, FAQPage',
  security: 'HSTS on, CSP missing',
  perf: 'TTFB 240 ms, LCP 1.9 s',
  ai: 'Scores and fixes written',
  prompt: 'Agent-ready prompt built'
};

// The score the example run lands on, built up as stages complete.
const FINAL_SCORE = 87;

/**
 * A pinned scene: scrolling advances an example audit stage by stage. Purely illustrative — it
 * shows the shape of a real run, and says so — but it uses the same stage list the live scanner does.
 */
export default function ScrollAudit() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const total = AUDIT_CHECKS.length;
  const [done, setDone] = useState(0);

  // Leave a little scroll at either end so the scene settles before it un-pins.
  const stagesDone = useTransform(scrollYProgress, [0.06, 0.88], [0, total]);
  useMotionValueEvent(stagesDone, 'change', (v) => setDone(Math.max(0, Math.min(total, Math.floor(v)))));
  const barWidth = useTransform(scrollYProgress, [0.06, 0.88], ['0%', '100%']);

  const score = Math.round((done / total) * FINAL_SCORE);
  const running = done < total ? done : -1;
  // Phones cannot fit all thirteen rows in the pinned viewport, so they see a five-row window that follows the run.
  const windowStart = Math.max(0, Math.min(total - 5, done - 2));

  return (
    <section ref={ref} id="how" className="relative" style={{ height: '320vh' }} aria-labelledby="scroll-audit-title">
      <div className="sticky top-0 min-h-screen flex items-center overflow-hidden py-20">
        <div className="absolute inset-0 landing-grid opacity-60" aria-hidden />
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">How an audit runs</p>
            <h2 id="scroll-audit-title" className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white text-balance">
              Thirteen stages. Every one visible as it happens.
            </h2>
            <p className="mt-5 hidden sm:block text-base sm:text-lg text-slate-300 leading-relaxed max-w-lg">
              No black box and no fake loading bar. You watch the scanner resolve your URL, render the page, read your markup,
              probe your headers and ask the AI to interpret what it found.
            </p>
            <div className="mt-6 sm:mt-8 flex items-center gap-6">
              <ScoreRing value={score} size={116} stroke={8} label="Score" />
              <div className="text-sm text-slate-400">
                <div className="text-2xl font-bold text-white tabular-nums">{done}<span className="text-slate-500">/{total}</span></div>
                stages complete
                <div className="mt-1 text-[11px] text-slate-500">Example run &mdash; scroll to advance</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl" role="img" aria-label="Animated example of an audit progressing through thirteen stages">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 bg-black/20">
              <span className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </span>
              <span className="flex-1 text-center text-[11px] font-mono text-slate-500">seoscan &mdash; example audit</span>
            </div>
            <div className="h-1 bg-white/5">
              <motion.div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400" style={{ width: barWidth }} />
            </div>
            <ul className="p-3 sm:p-4 space-y-1.5">
              {AUDIT_CHECKS.map((c, i) => {
                const state = i < done ? 'done' : i === running ? 'running' : 'pending';
                const Icon = c.Icon;
                return (
                  <li
                    key={c.id}
                    className={`${i >= windowStart && i < windowStart + 5 ? 'flex' : 'hidden lg:flex'} items-center gap-3 rounded-lg border px-3 py-2 text-xs sm:text-[13px] transition-all duration-300 ${
                      state === 'running' ? 'border-white/25 bg-white/[0.07]' : state === 'done' ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-white/5 bg-transparent'
                    }`}
                    style={{ opacity: state === 'pending' ? 0.45 : 1 }}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${state === 'done' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
                      {state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Icon className={`h-3.5 w-3.5 ${state === 'running' ? 'animate-pulse text-white' : ''}`} />}
                    </span>
                    <span className={`flex-1 truncate ${state === 'pending' ? 'text-slate-400' : 'text-slate-100'}`}>{c.label}</span>
                    <span className="hidden sm:block max-w-[45%] truncate text-[11px] text-slate-400">{state === 'done' ? EXAMPLE_RESULT[c.id] : state === 'running' ? 'running…' : ''}</span>
                    <span className="font-mono text-[9px]" style={{ color: TAG_COLOUR[c.tag] }}>{c.tag}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
