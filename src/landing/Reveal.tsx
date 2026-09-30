import type { ReactNode } from 'react';
import { motion } from 'motion/react';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fade-and-rise on first scroll into view. Reduced-motion users get the content without the travel. */
// `key` is declared because the project has no @types/react, so JSX props are checked literally.
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string; key?: string | number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">{title}</h2>
        {body && <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">{body}</p>}
      </Reveal>
    </div>
  );
}

/** Ring gauge that draws itself to `value` when scrolled into view (or immediately with `immediate`). */
export function ScoreRing({ value, size = 132, stroke = 9, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={`ring-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#ring-${size})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white tabular-nums">{Math.round(value)}</span>
        {label && <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
