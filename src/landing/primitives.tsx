import { useRef, type ReactNode, type MouseEvent } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, SplitText, prefersReducedMotion } from './motionKit';

interface SplitHeadingProps {
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  children: ReactNode;
  /** Play on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
  delay?: number;
}

/**
 * Headline whose words rise out of a mask, staggered. Words are masked individually so the
 * reveal survives the heading re-wrapping at other widths. Hidden until split so the raw text
 * never flashes before the animation starts.
 */
export function SplitHeading({ as = 'h2', className = '', children, immediate = false, delay = 0 }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = as as any;

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { el.style.visibility = 'visible'; return; }
    const split = SplitText.create(el, { type: 'words', mask: 'words' });
    el.style.visibility = 'visible';
    gsap.from(split.words, {
      yPercent: 130, rotate: 5, duration: 1.05, ease: 'power4.out', stagger: 0.055, delay,
      scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 88%', once: true }
    });
    return () => split.revert();
  }, { scope: ref });

  return <Tag ref={ref} className={`split-heading ${className}`} style={{ visibility: 'hidden' }}>{children}</Tag>;
}

/** Pulls its child toward the cursor, then springs back. */
export function Magnetic({ children, strength = 0.32, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, { scope: ref });

  return <span ref={ref} className={`inline-block ${className}`}>{children}</span>;
}

// `key` is declared because the project has no @types/react, so JSX props are checked literally.
/** Card with a light that follows the cursor across its surface and border. */
export function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return <div onMouseMove={onMove} className={`spot-card ${className}`}>{children}</div>;
}
