import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useScroll, useSpring } from 'motion/react';
import { Menu, Sparkles, X } from 'lucide-react';
import Hero from './Hero';
import { Marquee, Stats, XRay } from './Showpieces';
import { ScrollTrigger, scrollToId, scrollToTop, startSmoothScroll } from './motionKit';
import ScrollAudit from './ScrollAudit';
import { Agencies, Deliverable, Faq, FinalCta, Features, Problem } from './Sections';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#agencies', label: 'Agencies' },
  { href: '#faq', label: 'FAQ' }
];

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 shadow-lg shadow-blue-500/25">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      <span className="font-extrabold tracking-tight text-white">SEO Scan Pro</span>
    </span>
  );
}

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function Landing({ onGetStarted, onSignIn }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scrolling for the whole page, plus a layout refresh once web fonts have settled.
  useEffect(() => {
    window.scrollTo(0, 0);
    const stop = startSmoothScroll();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return stop;
  }, []);

  const go = (href: string) => {
    setMenu(false);
    scrollToId(href.slice(1));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div data-landing className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900">
          Skip to content
        </a>

        <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || menu ? 'border-b border-white/10 bg-slate-950/80 backdrop-blur-xl' : 'border-b border-transparent'}`}>
          <motion.div className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-sky-400 to-emerald-400" style={{ scaleX: progress }} aria-hidden />
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
            <a href="/" aria-label="SEO Scan Pro home" onClick={(e) => { e.preventDefault(); scrollToTop(); }}><Logo /></a>
            <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={(e) => { e.preventDefault(); go(l.href); }} className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 rounded">{l.label}</a>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex items-center gap-3">
              <button type="button" onClick={onSignIn} className="min-h-[44px] rounded-lg px-4 text-sm font-semibold text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">Sign in</button>
              <button type="button" onClick={onGetStarted} className="min-h-[44px] rounded-lg bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">Get started</button>
            </div>
            <button
              type="button" className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
              aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}
            >
              {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
          <AnimatePresence>
            {menu && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }} className="overflow-hidden md:hidden"
              >
                <div className="space-y-1 px-4 pb-5 pt-2">
                  {LINKS.map((l) => (
                    <a key={l.href} href={l.href} onClick={(e) => { e.preventDefault(); go(l.href); }} className="block rounded-lg px-3 py-3 text-base font-medium text-slate-200 hover:bg-white/5">{l.label}</a>
                  ))}
                  <div className="flex gap-3 pt-3">
                    <button type="button" onClick={onSignIn} className="min-h-[48px] flex-1 rounded-lg border border-white/15 text-sm font-semibold text-white">Sign in</button>
                    <button type="button" onClick={onGetStarted} className="min-h-[48px] flex-1 rounded-lg bg-white text-sm font-bold text-slate-900">Get started</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main id="main">
          <Hero onGetStarted={onGetStarted} onSeeHow={() => scrollToId('how')} />
          <Marquee />
          <Problem />
          <XRay />
          <Features />
          <Stats />
          <ScrollAudit />
          <Deliverable />
          <Agencies onGetStarted={onGetStarted} />
          <Faq />
          <FinalCta onGetStarted={onGetStarted} />
        </main>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-slate-400 sm:flex-row sm:px-6 lg:px-8">
            <Logo />
            <p>&copy; {new Date().getFullYear()} SEO Scan Pro. Enterprise SEO audits, in one scan.</p>
            <div className="flex gap-5">
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <button type="button" onClick={onSignIn} className="hover:text-white">Sign in</button>
              <button type="button" onClick={onGetStarted} className="hover:text-white">Create account</button>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
