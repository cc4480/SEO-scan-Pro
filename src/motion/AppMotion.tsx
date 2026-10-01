import { useEffect, useState } from 'react';
import ParticleField from '../landing/ParticleField';
import { gsap, ScrollTrigger, prefersReducedMotion, startSmoothScroll } from '../landing/motionKit';

// Everything that should feel alive as it appears: the app's glass cards and panels, plus anything
// opted in with data-reveal. The landing page runs its own choreography, and data-no-reveal opts out.
const REVEAL = '.glass-card, .glass-panel, [data-reveal]';
const SKIP = '[data-landing], [data-no-reveal]';

function eligible(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && !el.dataset.rv && !el.closest(SKIP);
}

function reveal(els: HTMLElement[]) {
  if (!els.length) return;
  for (const el of els) el.dataset.rv = '1';
  gsap.set(els, { opacity: 0, y: 26 });
  ScrollTrigger.batch(els, {
    start: 'top 95%',
    once: true,
    batchMax: 8,
    interval: 0.08,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'opacity,transform' })
  });
  // Safety net: anything that is on screen but never fired (odd scroll container, hidden then shown)
  // is shown rather than left invisible.
  window.setTimeout(() => {
    for (const el of els) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === '0') {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.5, clearProps: 'opacity,transform' });
      }
    }
  }, 3200);
}

function collect(root: ParentNode): HTMLElement[] {
  const found: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.matches(REVEAL) && eligible(root)) found.push(root);
  root.querySelectorAll(REVEAL).forEach((el) => { if (eligible(el)) found.push(el); });
  return found;
}

/**
 * App-wide motion, driven from the DOM so every page gets it without per-component wiring:
 *  - a live particle backdrop behind the app and the auth screens
 *  - inertial smooth scrolling
 *  - a light that follows the cursor across glass surfaces
 *  - staggered, scroll-triggered entrances for every card and panel, including ones rendered later
 * Reduced-motion users get none of it.
 */
export default function AppMotion() {
  const [onLanding, setOnLanding] = useState(false);
  // The embeddable widget is iframed into other people's sites: no backdrop, smooth scroll or hijacked wheel there.
  const still = prefersReducedMotion() || (typeof window !== 'undefined' && window.location.pathname === '/embed');

  useEffect(() => {
    if (still) return;
    const stopScroll = startSmoothScroll();

    const root = document.getElementById('root');
    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 350);
    };

    const sync = () => setOnLanding(!!document.querySelector('[data-landing]'));
    if (root) reveal(collect(root));
    sync();

    const mo = new MutationObserver((records) => {
      const fresh: HTMLElement[] = [];
      for (const rec of records) {
        rec.addedNodes.forEach((n) => { if (n instanceof HTMLElement) fresh.push(...collect(n)); });
      }
      if (fresh.length) { reveal(fresh); scheduleRefresh(); }
      sync();
    });
    if (root) mo.observe(root, { childList: true, subtree: true });

    // Cursor light: set the position on whichever glass surface is under the pointer.
    let last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const t = e.target instanceof Element ? (e.target.closest('.glass-card, .glass-panel, .spot-card') as HTMLElement | null) : null;
      if (last && last !== t) { last.style.removeProperty('--mx'); last.style.removeProperty('--my'); }
      last = t;
      if (!t || t.closest('[data-landing]')) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`);
      t.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      mo.disconnect();
      window.clearTimeout(refreshTimer);
      document.removeEventListener('pointermove', onMove);
      stopScroll();
    };
  }, [still]);

  if (still) return null;
  return (
    <div id="app-backdrop" aria-hidden className="fixed inset-0 z-0 pointer-events-none" style={{ display: onLanding ? 'none' : 'block' }}>
      <div className="aurora absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[140px]" />
      <div className="aurora-2 absolute bottom-0 -right-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <ParticleField className="opacity-45" density={0.55} />
    </div>
  );
}
