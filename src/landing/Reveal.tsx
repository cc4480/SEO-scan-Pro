import { useEffect, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { SplitHeading } from './primitives';

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
      </Reveal>
      <SplitHeading as="h2" className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">{title}</SplitHeading>
      {body && <Reveal delay={0.15}><p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">{body}</p></Reveal>}
    </div>
  );
}

/** Ring gauge that draws itself to `value` and counts the number up, re-animating whenever `value` changes. */
export function ScoreRing({ value, size = 132, stroke = 9, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const shown = useTransform(mv, (v) => String(Math.round(v)));
  const offset = useTransform(mv, (v) => c * (1 - v / 100));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.4, ease: EASE });
    return () => controls.stop();
  }, [value, mv]);
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
          strokeDasharray={c} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-3xl font-extrabold text-white tabular-nums">{shown}</motion.span>
        {label && <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
