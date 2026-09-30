import { useEffect, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { PRIVACY, TERMS, type LegalDoc } from './content';

export type LegalKind = 'terms' | 'privacy';

// Plain anchors on purpose: the server answers every path with the app shell, so these pages
// are real, crawlable URLs that also work when opened directly or in a new tab.
export function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      <a href="/terms" className="underline underline-offset-2 hover:text-white">Terms</a>
      {' · '}
      <a href="/privacy" className="underline underline-offset-2 hover:text-white">Privacy</a>
    </span>
  );
}

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const doc: LegalDoc = kind === 'terms' ? TERMS : PRIVACY;
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${doc.title} | SEO Scan Pro`;
    window.scrollTo(0, 0);
    fetch('/api/public-config').then((r) => (r.ok ? r.json() : null)).then((c) => setEmail(c?.supportEmail ?? null)).catch(() => {});
  }, [doc.title]);

  return (
    <div className="min-h-screen text-slate-200">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5" aria-label="SEO Scan Pro home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="font-extrabold tracking-tight text-white">SEO Scan Pro</span>
          </a>
          <a href="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <article className="glass-card rounded-3xl p-6 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated {doc.updated}</p>
          <p className="mt-5 text-base leading-relaxed text-slate-300">{doc.summary}</p>

          {doc.sections.map((s) => (
            <section key={s.heading} className="mt-9">
              <h2 className="text-lg font-bold text-white">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-3 text-[15px] leading-relaxed text-slate-300">{p}</p>
              ))}
              {s.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-300 marker:text-emerald-400">
                  {s.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}

          {email && (
            <section className="mt-9">
              <h2 className="text-lg font-bold text-white">Contact</h2>
              <p className="mt-3 text-[15px] text-slate-300">
                Questions about this page or your data: <a className="text-sky-300 underline underline-offset-2" href={`mailto:${email}`}>{email}</a>
              </p>
            </section>
          )}
        </article>

        <p className="mt-8 text-center text-sm text-slate-500">
          <LegalLinks /> · <a href="/" className="underline underline-offset-2 hover:text-white">Home</a>
        </p>
      </main>
    </div>
  );
}
