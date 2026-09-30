import { useRef, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import ParticleField from './ParticleField';
import HeroDemo from './HeroDemo';
import { Magnetic, SplitHeading } from './primitives';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero({ onGetStarted, onSeeHow }: { onGetStarted: () => void; onSeeHow: () => void }) {
  const ref = useRef<HTMLElement>(null);

  // A soft light that trails the cursor across the hero.
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--hx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--hy', `${e.clientY - r.top}px`);
  };

  return (
    <section ref={ref} onMouseMove={onMove} className="hero-light relative overflow-hidden pt-28 sm:pt-36 pb-24 sm:pb-32 min-h-[92vh]">
      <div className="landing-grid absolute inset-0" aria-hidden />
      <ParticleField className="opacity-80" />
      <div className="aurora absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/25 blur-[140px]" aria-hidden />
      <div className="aurora-2 absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[120px]" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.7, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
            SEO + AI-search (AEO/GEO) audits in one scan
          </motion.p>

          <SplitHeading as="h1" immediate delay={0.15} className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Find out why your site isn&rsquo;t ranking <span className="shimmer-text">in Google or AI search.</span>
          </SplitHeading>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            SEO Scan Pro loads your site in a real browser, runs 13 audit stages across technical SEO, content, AI-answer readiness,
            security and speed, then hands you a branded report and a ready-made prompt for your coding agent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.05, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <button
                type="button" onClick={onGetStarted}
                className="btn-shine group relative inline-flex min-h-[52px] items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/40 transition-shadow hover:shadow-blue-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                Run my first audit
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Magnetic>
            <Magnetic strength={0.22}>
              <button
                type="button" onClick={onSeeHow}
                className="inline-flex min-h-[52px] items-center rounded-xl border border-white/15 bg-white/5 px-7 text-sm font-semibold text-slate-100 backdrop-blur transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                See how it works
              </button>
            </Magnetic>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.3 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"
          >
            <li>Real-browser rendering</li>
            <li>Most audits finish in under a minute</li>
            <li>Live, event-by-event audit log</li>
            <li>White-label PDF reports</li>
          </motion.ul>
        </div>

        <HeroDemo />
      </div>

      <motion.div
        aria-hidden className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-slate-500 lg:flex"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
      >
        Scroll
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}><ChevronDown className="h-4 w-4" /></motion.span>
      </motion.div>
    </section>
  );
}
