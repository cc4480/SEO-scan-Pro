import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity, ArrowRight, Bot, ChevronDown, EyeOff, FileWarning, Globe, Palette, ShieldCheck, Sparkles, Users, Wand2
} from 'lucide-react';
import { Reveal, SectionHeading } from './Reveal';

const CARD = 'group relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]';

export function Problem() {
  const items = [
    { Icon: EyeOff, title: 'Audits that only read raw HTML', body: 'If your content is drawn by JavaScript, a plain-HTML crawler sees an empty page and reports problems that are not there.' },
    { Icon: Bot, title: 'Invisible to AI answers', body: 'ChatGPT-style search picks sources it can parse. Missing llms.txt, thin structured data and buried answers keep you out of the reply.' },
    { Icon: FileWarning, title: 'Reports you cannot send', body: 'A wall of jargon with someone else’s logo is not a deliverable. Clients want a clear score, the fixes, and your name on top.' }
  ];
  return (
    <section className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="The problem" title="Most SEO audits miss half the picture" />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.1} className="h-full">
              <div className={CARD}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300"><it.Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-bold text-white">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const items = [
    { Icon: Globe, title: 'Real-browser crawling', body: 'Pages render in headless Chromium, so JavaScript-built content, meta tags and structured data are read the way a visitor sees them. Single page or a deep site crawl.' },
    { Icon: Bot, title: 'AEO / GEO readiness', body: 'Checks llms.txt, schema types and answer-friendly structure, and scores how ready you are to be quoted by AI search.' },
    { Icon: ShieldCheck, title: 'Security and speed checks', body: 'Reads HTTPS, HSTS, CSP and other headers from the real response, samples for broken links, and records TTFB and lab Core Web Vitals.' },
    { Icon: Palette, title: 'White-label reports', body: 'Your agency name, colours and footer on a downloadable PDF or HTML report. Choose which sections each client sees.' },
    { Icon: Activity, title: 'Monitoring and alerts', body: 'Schedule recurring scans and get an email when a site’s score drops, with the new critical issues listed.' },
    { Icon: Users, title: 'Lead-capture widget', body: 'Embed a free-audit form on your own site. Prospects run a scan, and their contact details land in your Leads tab.' }
  ];
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What you get"
          title="One scan. Everything a client asks about."
          body="Built for teams who audit sites for a living and for owners who just want to know what to fix first."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 0.08} className="h-full">
              <div className={CARD}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-emerald-400/20 text-sky-200"><it.Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-bold text-white">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <p className="text-center text-sm text-slate-400">
            Also included: <span className="text-slate-200">agent-ready fix prompts</span> · <span className="text-slate-200">competitor benchmarking</span> ·{' '}
            <span className="text-slate-200">scan-to-scan comparison</span> · <span className="text-slate-200">API keys</span> ·{' '}
            <span className="text-slate-200">CSV and JSON export</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Deliverable() {
  const steps = [
    { n: '01', title: 'Paste a URL', body: 'Pick a single page or a deep crawl. Nothing to install and no code on your site.' },
    { n: '02', title: 'Watch it run', body: 'A live audit log shows each request and measurement as the scanner makes it.' },
    { n: '03', title: 'Ship the fixes', body: 'Get scored findings, remediation steps, a branded report, and a prompt you can paste into your coding agent.' }
  ];
  return (
    <section className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="In three steps" title="From URL to fix list in minutes" />
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.1} className="h-full">
                <div className={CARD}>
                  <span className="font-mono text-sm font-bold text-emerald-300">{s.n}</span>
                  <h3 className="mt-3 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 flex gap-4 items-start">
            <Wand2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-300" />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-white">Honest by design.</span> If a site cannot be reached, the report says so with a prominent
              &ldquo;simulated data&rdquo; warning instead of inventing results, and findings must be backed by what the crawler actually saw.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Agencies({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="agencies" className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">For agencies and freelancers</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">Turn audits into a lead machine</h2>
          <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
            Put a free-audit form on your website. Every prospect who runs a scan becomes a lead with their site already analysed,
            so your first conversation starts with their real problems.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            {['Your brand on every report and on the widget', 'Leads collected in one tab, exportable to CSV', 'Monitors re-scan client sites and alert you on drops'].map((t) => (
              <li key={t} className="flex gap-3"><Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-sky-300" />{t}</li>
            ))}
          </ul>
          <button
            type="button" onClick={onGetStarted}
            className="group mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Set up my agency workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-panel mx-auto max-w-md rounded-3xl p-6 shadow-2xl" aria-label="Example of the embeddable audit widget" role="img">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-400"><Sparkles className="h-4 w-4 text-white" /></span>
              <div>
                <div className="text-sm font-bold text-white">Your Agency Name</div>
                <div className="text-[11px] text-slate-400">Free website SEO audit</div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-400">https://prospect-site.com</div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-400">name@company.com</div>
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-2.5 text-center text-sm font-bold text-white">Run my free audit</div>
            </div>
            <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-slate-500">Example widget</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FAQS = [
  { q: 'What does an audit check?', a: 'Thirteen stages: URL validation, robots.txt and sitemap, llms.txt, page rendering, meta tags, headings and content depth, images and alt text, links (with a broken-link sample), structured data, security headers, performance and lab Core Web Vitals, then the AI analysis and the agent-ready prompt.' },
  { q: 'Does it work on JavaScript-heavy sites?', a: 'Yes. Pages are loaded in a real headless browser, so content rendered by JavaScript is analysed, not just the initial HTML.' },
  { q: 'Is the AI required?', a: 'The analysis uses DeepSeek. If it is unavailable, a deterministic local report is generated from the crawl statistics so the workflow never breaks, and the saved audit log records which one you got.' },
  { q: 'What happens to the URLs I scan?', a: 'The scanner fetches the public page and its supporting files. A structured summary of what it found is sent to DeepSeek to write the analysis. Private and internal addresses are refused.' },
  { q: 'Can I put my own branding on reports?', a: 'Yes. Set your agency name, colours, footer and which sections appear, then download the report as PDF or HTML.' },
  { q: 'Can it scan pages behind a login?', a: 'No. It audits what a public visitor or search crawler can reach.' }
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.04]">
                <h3>
                  <button
                    type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full min-h-[56px] items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
                  >
                    {f.q}
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`} role="region"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-300">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[820px] rounded-full bg-blue-600/25 blur-[130px]" aria-hidden />
      <Reveal className="relative max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white text-balance">See what your site looks like to search engines and AI</h2>
        <p className="mt-5 text-lg text-slate-300">Create an account, paste a URL, and watch the audit run.</p>
        <button
          type="button" onClick={onGetStarted}
          className="group mt-9 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Run my first audit <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </Reveal>
    </section>
  );
}
