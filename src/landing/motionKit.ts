import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;
let ticker: ((time: number) => void) | null = null;

let users = 0;

/**
 * Inertial smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis share one clock
 * (two competing loops is what makes scroll-linked animation jitter). Reference-counted, because
 * the app shell and the landing page both ask for it. Skipped for reduced-motion users, who keep
 * native scrolling. Returns the teardown.
 */
export function startSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {};
  users += 1;
  let tick: ((time: number) => void) | null = null;
  if (!lenis) {
    // allowNestedScroll: inner scroll areas (audit log, tab bar, selects) keep native scrolling.
    lenis = new Lenis({ duration: 1.15, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), allowNestedScroll: true });
    lenis.on('scroll', ScrollTrigger.update);
    tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ticker = tick;
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    users -= 1;
    if (users <= 0 && lenis) {
      if (ticker) gsap.ticker.remove(ticker);
      lenis.destroy();
      lenis = null;
      ticker = null;
      users = 0;
    }
  };
}

/** Smooth-scroll to an element id, through Lenis when it is running. */
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -64 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
