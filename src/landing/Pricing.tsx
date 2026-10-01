import { useEffect, useState } from 'react';
import PlanCards, { type PlanCta } from '../billing/PlanCards';
import { PLAN_ORDER, PLANS, type BillingInterval, type PlanId } from '../plans';
import { Reveal, SectionHeading } from './Reveal';

/** Public pricing. Every button leads to sign-up; paying happens inside the app once signed in. */
export default function Pricing({ onGetStarted }: { onGetStarted: () => void }) {
  const [interval, setInterval] = useState<BillingInterval>('year');
  const [billingOn, setBillingOn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/public-config').then((r) => (r.ok ? r.json() : null)).then((c) => setBillingOn(!!c?.billingEnabled)).catch(() => setBillingOn(false));
  }, []);

  const ctas = {} as Record<PlanId, PlanCta>;
  for (const id of PLAN_ORDER) {
    ctas[id] = id === 'FREE'
      ? { label: 'Start free', onClick: onGetStarted, note: 'No card needed' }
      : { label: billingOn ? `Get ${PLANS[id].name}` : 'Create account', onClick: onGetStarted, note: billingOn ? 'Subscribe after you sign up' : 'Paid plans open soon' };
  }

  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Pricing" title="Simple plans that pay for themselves" body="Start free. Upgrade when you need white-label reports, deep crawls and the lead widget." />
        <Reveal delay={0.1} className="mt-12">
          <PlanCards interval={interval} onIntervalChange={setInterval} ctas={ctas} />
        </Reveal>
        <p className="mt-8 text-center text-xs text-slate-500">
          Prices in USD. Audit allowances are per rolling 30 days. Cancel any time and keep access until the end of the period you paid for.
        </p>
      </div>
    </section>
  );
}
