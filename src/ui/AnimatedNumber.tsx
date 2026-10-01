import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';

/**
 * Counts up to `value` the first time it scrolls into view, and re-counts from the previous value
 * whenever `value` changes. Falls back to the plain number if the user prefers reduced motion.
 */
export default function AnimatedNumber({ value, duration = 1.2, decimals = 0 }: { value: number; duration?: number; decimals?: number; key?: string | number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const mv = useMotionValue(0);
  const shown = useTransform(mv, (v) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))));

  useEffect(() => {
    if (!inView) return;
    const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) { mv.set(value); return; }
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, value, duration, mv]);

  return <motion.span ref={ref} className="tabular-nums">{shown}</motion.span>;
}
