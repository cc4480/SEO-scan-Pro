import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { PLAN_ORDER, PLANS, yearlyPerMonth, yearlySavingsPercent, type BillingInterval, type PlanId } from '../plans';
import AnimatedNumber from '../ui/AnimatedNumber';

export interface PlanCta {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Small line under the button. */
  note?: string;
}

interface PlanCardsProps {
  interval: BillingInterval;
  onIntervalChange: (i: BillingInterval) => void;
  ctas: Record<PlanId, PlanCta>;
  current?: PlanId;
}

const SAVE = yearlySavingsPercent(PLANS.AGENCY);

export function IntervalToggle({ interval, onChange }: { interval: BillingInterval; onChange: (i: BillingInterval) => void }) {
  const opts: { id: BillingInterval; label: string }[] = [{ id: 'month', label: 'Monthly' }, { id: 'year', label: 'Annual' }];
  return (
    <div className="inline-flex items-center gap-3">
      <div role="group" aria-label="Billing interval" className="relative inline-flex rounded-full border border-white/10 bg-white/5 p-1">
        {opts.map((o) => (
          <button
            key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={interval === o.id}
            className={`relative z-10 min-h-[40px] rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${interval === o.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {interval === o.id && (
              <motion.span layoutId="interval-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            {o.label}
          </button>
        ))}
      </div>
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">Save {SAVE}%</span>
    </div>
  );
}

/** The three plans side by side. Used on the landing page and inside the Billing tab. */
export default function PlanCards({ interval, onIntervalChange, ctas, current }: PlanCardsProps) {
  return (
    <div>
      <div className="flex justify-center"><IntervalToggle interval={interval} onChange={onIntervalChange} /></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const cta = ctas[id];
          const featured = id === 'AGENCY';
          const monthly = interval === 'month';
          const perMonth = monthly ? plan.priceMonthly : yearlyPerMonth(plan);
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-3xl border p-7 transition ${featured ? 'border-sky-400/40 bg-gradient-to-b from-sky-400/[0.08] to-transparent shadow-xl shadow-brand-950/40' : 'border-white/10 bg-white/[0.04]'} ${current === id ? 'ring-2 ring-emerald-400/60' : ''}`}
            >
              {current === id && <span className="absolute -top-3 left-7 rounded-full bg-emerald-400 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-950">Your plan</span>}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-white">$<AnimatedNumber key={`${id}-${interval}`} value={perMonth} decimals={monthly || id === 'FREE' ? 0 : 2} duration={0.7} /></span>
                <span className="text-sm text-slate-400">/month</span>
              </div>
              <p className="mt-1 h-5 text-xs text-slate-400">
                {id === 'FREE' ? 'Free forever' : monthly ? 'Billed monthly' : `Billed $${plan.priceYearly} per year`}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{h}</li>
                ))}
              </ul>
              <button
                type="button" onClick={cta.onClick} disabled={cta.disabled}
                className={`mt-8 min-h-[48px] w-full rounded-xl text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-60 ${featured ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg shadow-brand-600/30' : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'}`}
              >
                {cta.label}
              </button>
              <p className="mt-2 h-4 text-center text-[11px] text-slate-500">{cta.note || ''}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
