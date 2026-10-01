import type { BillingInterval, PlanDef, PlanId } from '../plans';

export interface BillingStatus {
  enabled: boolean;
  plan: PlanId;
  comped: boolean;
  status: string | null;
  interval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManage: boolean;
  usage: { scans30d: number; scanLimit: number; monitors: number; monitorLimit: number };
  limits: PlanDef;
}

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export async function fetchBilling(): Promise<BillingStatus | null> {
  try {
    const res = await fetch('/api/billing', { headers: headers() });
    return res.ok ? ((await res.json()) as BillingStatus) : null;
  } catch {
    return null;
  }
}

async function post(path: string, body?: unknown): Promise<string> {
  const res = await fetch(path, { method: 'POST', headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data.url as string;
}

/** Returns Stripe's hosted Checkout URL; the browser is sent there to pay. */
export const startCheckout = (plan: 'STARTER' | 'AGENCY', interval: BillingInterval) => post('/api/billing/checkout', { plan, interval });

/** Returns Stripe's Customer Portal URL (change plan, card, invoices, cancel). */
export const openPortal = () => post('/api/billing/portal');
