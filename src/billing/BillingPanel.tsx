import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CreditCard, ExternalLink, Loader } from 'lucide-react';
import { PLANS, isPaidPlan, type BillingInterval, type PlanId } from '../plans';
import { notify } from '../ui/notify';
import PlanCards, { type PlanCta } from './PlanCards';
import { openPortal, startCheckout, type BillingStatus } from './billingApi';

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = pct >= 100 ? 'from-rose-500 to-rose-400' : pct >= 80 ? 'from-amber-500 to-amber-300' : 'from-sky-400 to-emerald-400';
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="tabular-nums text-slate-400">{used} / {limit}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit} aria-label={label}>
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${tone}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '');

export default function BillingPanel({ billing }: { billing: BillingStatus }) {
  const [interval, setInterval] = useState<BillingInterval>('year');
  const [busy, setBusy] = useState<string | null>(null);
  const plan = PLANS[billing.plan];
  const paid = isPaidPlan(billing.plan) && !billing.comped;

  const go = async (key: string, run: () => Promise<string>) => {
    setBusy(key);
    try {
      window.location.assign(await run());
    } catch (err: any) {
      notify(err?.message || 'Could not open billing. Please try again.');
      setBusy(null);
    }
  };

  const ctas = {} as Record<PlanId, PlanCta>;
  for (const id of ['FREE', 'STARTER', 'AGENCY'] as PlanId[]) {
    if (billing.plan === id) ctas[id] = { label: 'Current plan', disabled: true };
    else if (billing.comped) ctas[id] = { label: 'Not needed', disabled: true, note: 'Your account has full access' };
    else if (paid) ctas[id] = { label: busy === 'portal' ? 'Opening…' : 'Change in billing portal', onClick: () => go('portal', openPortal), disabled: busy !== null };
    else if (id === 'FREE') ctas[id] = { label: 'Included', disabled: true };
    else ctas[id] = { label: busy === id ? 'Opening checkout…' : `Upgrade to ${PLANS[id].name}`, onClick: () => go(id, () => startCheckout(id as 'STARTER' | 'AGENCY', interval)), disabled: busy !== null, note: 'Secure checkout by Stripe' };
  }

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><CreditCard className="h-4 w-4" /> Plan &amp; billing</div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
              {billing.comped ? 'Complimentary access' : `${plan.name} plan`}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {billing.comped && 'Your account has full Agency access. No subscription is needed.'}
              {!billing.comped && billing.plan === 'FREE' && 'You are on the Free plan. Upgrade for deep crawls, white-label reports, monitors and more.'}
              {paid && billing.cancelAtPeriodEnd && `Cancels on ${fmt(billing.currentPeriodEnd)}. You keep full access until then.`}
              {paid && !billing.cancelAtPeriodEnd && billing.currentPeriodEnd && `Renews on ${fmt(billing.currentPeriodEnd)} · billed ${billing.interval === 'year' ? 'annually' : 'monthly'}.`}
            </p>
          </div>
          {billing.canManage && !billing.comped && (
            <button
              type="button" onClick={() => go('portal', openPortal)} disabled={busy !== null}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {busy === 'portal' ? <Loader className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Manage billing
            </button>
          )}
        </div>

        {billing.status === 'past_due' && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Your last payment did not go through. Update your card in <strong>Manage billing</strong> to keep your plan.</span>
          </div>
        )}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <UsageMeter label="Audits in the last 30 days" used={billing.usage.scans30d} limit={billing.usage.scanLimit} />
          <UsageMeter label="Scheduled monitors" used={billing.usage.monitors} limit={billing.usage.monitorLimit} />
        </div>
      </div>

      <div>
        <PlanCards interval={interval} onIntervalChange={setInterval} ctas={ctas} current={billing.plan} />
        <p className="mt-6 text-center text-xs text-slate-500">
          Payments are handled by Stripe; card details never reach our servers. Cancel any time from Manage billing and keep access until the end of the period you paid for.
        </p>
      </div>
    </div>
  );
}
