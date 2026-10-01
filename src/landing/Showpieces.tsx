import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Check, X } from 'lucide-react';
import { gsap, prefersReducedMotion } from './motionKit';
import { SplitHeading } from './primitives';

const ROW_A = ['robots.txt', 'sitemap.xml', 'llms.txt', 'JSON-LD schema', 'canonical tags', 'hreflang', 'Open Graph', 'meta descriptions', 'heading structure', 'alt text'];
const ROW_B = ['Core Web Vitals', 'TTFB', 'HSTS', 'Content-Security-Policy', 'redirect chains', 'broken links', 'AEO / GEO readiness', 'answer-engine friendliness', 'security headers', 'JavaScript rendering'];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden py-2" aria-hidden>
      <div className={`marquee-track flex w-max gap-3 ${reverse ? 'marquee-reverse' : ''}`}>
        {loop.map((t, i) => (
          <span key={`${t}-${i}`} className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
            <span className="mr-2 text-emerald-300">&#9679;</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Endless ticker of the things every audit inspects. Decorative: the list is repeated in the FAQ and features. */
export function Marquee() {
  return (
    <section className="relative border-y border-white/5 bg-white/[0.015] py-8" aria-label="What every audit checks">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Every audit inspects</p>
      <MarqueeRow items={ROW_A} />
      <MarqueeRow items={ROW_B} reverse />
    </section>
  );
}

const STATS = [
  { end: 13, label: 'audit stages per scan' },
  { end: 5, label: 'scores: overall, technical, content, AEO/GEO, speed' },
  { end: 8, label: 'live log channels, colour-coded' },
  { end: 4, label: 'export formats: PDF, HTML, CSV, JSON' }
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
    });
    gsap.from('[data-stat]', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } });
  }, { scope: ref });

  return (
    <section ref={ref} className="relative py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((s) => (
          <div key={s.label} data-stat className="text-center">
            <div className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-extrabold tabular-nums text-transparent sm:text-6xl" data-count={s.end}>{s.end}</div>
            <p className="mx-auto mt-2 max-w-[14rem] text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Pinned scene: the page a plain-HTML crawler receives (an empty shell) is wiped away by the page
 * a real browser renders, driven directly by scroll. The numbers are illustrative of a typical
 * JavaScript-built site, and the section says so.
 */
export function XRay() {
  const sec = useRef<HTMLElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!top.current || !handle.current) return;
    if (prefersReducedMotion()) { gsap.set(top.current, { clipPath: 'inset(0 0% 0 0)' }); gsap.set(handle.current, { display: 'none' }); return; }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec.current, start: 'top top', end: '+=140%', scrub: 0.7, pin: true, anticipatePin: 1 }
    });
    tl.fromTo(top.current, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', duration: 1 }, 0)
      .fromTo(handle.current, { left: '0%' }, { left: '100%', ease: 'none', duration: 1 }, 0)
      .from('[data-xr-stat]', { opacity: 0, y: 14, stagger: 0.18, ease: 'power2.out', duration: 0.2 }, 0.3);
  }, { scope: sec });

  return (
    <section ref={sec} className="relative flex min-h-screen flex-col justify-center overflow-hidden py-20" aria-labelledby="xray-title">
      <div className="absolute inset-0 landing-grid opacity-50" aria-hidden />
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Real-browser crawling</p>
          <SplitHeading as="h2" id="xray-title" className="mt-3 text-3xl font-extrabold tracking-tight text-white text-balance sm:text-5xl">
            Most crawlers see an empty page. We see yours.
          </SplitHeading>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Scroll to compare what a plain-HTML crawler receives from a JavaScript-built site with what a real browser renders.</p>
        </div>

        <div className="relative mt-10 h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl sm:h-[420px]" role="img" aria-label="Comparison of a plain-HTML crawler's empty view against the fully rendered page">
          {/* Layer 1 — raw HTML */}
          <div className="absolute inset-0 p-5 sm:p-7">
            <span className="absolute right-5 top-5 rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-rose-300 sm:right-7 sm:top-7">Plain-HTML crawler</span>
            <pre className="mx-auto mt-14 w-fit font-mono text-[11px] leading-relaxed text-slate-400 sm:mt-16 sm:text-sm">{`<html>
  <head><title>Loading…</title></head>
  <body>
    <div id="root"></div>
    <script src="/app.js"></script>
  </body>
</html>`}</pre>
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-4 gap-2 sm:bottom-7 sm:left-7 sm:right-7">
              {['0 headings', '0 links', '0 words', '0 images'].map((t) => (
                <div key={t} className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/5 px-1 py-2 text-[10px] text-rose-300 sm:text-xs"><X className="h-3 w-3" />{t}</div>
              ))}
            </div>
          </div>

          {/* Layer 2 — rendered page, wiped in by scroll */}
          <div ref={top} className="absolute inset-0 bg-slate-900 p-5 sm:p-7" style={{ clipPath: 'inset(0 100% 0 0)' }}>
            <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">SeoScan &middot; real browser</span>
            <div className="mt-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-white/90" />
              <div className="h-2.5 w-full rounded bg-white/20" />
              <div className="h-2.5 w-5/6 rounded bg-white/20" />
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[0, 1, 2].map((n) => (<div key={n} className="h-16 rounded-lg bg-gradient-to-br from-sky-400/25 to-emerald-400/20 sm:h-24" />))}
              </div>
            </div>
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-4 gap-2 sm:bottom-7 sm:left-7 sm:right-7">
              {['1 H1 · 6 H2', '42 links', '1,240 words', '32 images'].map((t) => (
                <div key={t} data-xr-stat className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-1 py-2 text-[10px] text-emerald-300 sm:text-xs"><Check className="h-3 w-3" />{t}</div>
              ))}
            </div>
          </div>

          {/* Scan handle */}
          <div ref={handle} className="pointer-events-none absolute top-0 z-10 h-full w-px -translate-x-1/2 bg-emerald-300" style={{ left: '0%', boxShadow: '0 0 24px 4px rgba(52,211,153,0.7)' }} aria-hidden>
            <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-300/60 bg-slate-950 text-emerald-300">
              <span className="text-xs font-bold">&#8646;</span>
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Illustrative example of a typical JavaScript-built site.</p>
      </div>
    </section>
  );
}
