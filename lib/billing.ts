import Stripe from 'stripe';
import { prisma } from './db';
import { isPaidPlan, type BillingInterval, type PlanId } from '../src/plans';

// ---- Configuration ---------------------------------------------------------------------------
// Billing is OFF until every variable below is set. While it is off nothing is enforced and every
// account keeps today's behaviour, so deploying this code changes nothing for existing users.

const PRICE_ENV: Record<'STARTER' | 'AGENCY', Record<BillingInterval, string>> = {
  STARTER: { month: 'STRIPE_PRICE_STARTER_MONTHLY', year: 'STRIPE_PRICE_STARTER_YEARLY' },
  AGENCY: { month: 'STRIPE_PRICE_AGENCY_MONTHLY', year: 'STRIPE_PRICE_AGENCY_YEARLY' }
};

export function billingEnabled(): boolean {
  const e = process.env;
  if (!e.STRIPE_SECRET_KEY || !e.STRIPE_WEBHOOK_SECRET) return false;
  return Object.values(PRICE_ENV).every((p) => Object.values(p).every((name) => !!e[name]));
}

export function priceIdFor(plan: 'STARTER' | 'AGENCY', interval: BillingInterval): string | undefined {
  return process.env[PRICE_ENV[plan][interval]];
}

export function planForPriceId(priceId: string): { plan: 'STARTER' | 'AGENCY'; interval: BillingInterval } | null {
  for (const plan of ['STARTER', 'AGENCY'] as const) {
    for (const interval of ['month', 'year'] as const) {
      if (process.env[PRICE_ENV[plan][interval]] === priceId) return { plan, interval };
    }
  }
  return null;
}

// ---- Stripe client ---------------------------------------------------------------------------

let client: Stripe | null = null;
let override: any = null;

/** Tests inject a fake; production builds the real client lazily from STRIPE_SECRET_KEY. */
export function setStripeClientForTests(fake: any | null): void {
  override = fake;
}

export function getStripe(): Stripe {
  if (override) return override;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return client;
}

export function appUrl(): string {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
}

// ---- Checkout and portal ---------------------------------------------------------------------

interface BillingUser {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}

async function ensureCustomer(user: BillingUser): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await getStripe().customers.create({ email: user.email, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/** Stripe-hosted Checkout: card details never touch this server. */
export async function createCheckoutSession(user: BillingUser, plan: 'STARTER' | 'AGENCY', interval: BillingInterval): Promise<string> {
  const price = priceIdFor(plan, interval);
  if (!price) throw new Error(`No Stripe price configured for ${plan}/${interval}`);
  const customer = await ensureCustomer(user);
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/?billing=success`,
    cancel_url: `${appUrl()}/?billing=cancel`
  });
  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

/** Stripe's Customer Portal: change plan, update card, see invoices, cancel. */
export async function createPortalSession(user: BillingUser): Promise<string> {
  if (!user.stripeCustomerId) throw new Error('No billing account yet');
  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl()}/?billing=portal`
  });
  return session.url;
}

/** Stop the subscription immediately. Used when an account is deleted so it is never billed again. */
export async function cancelSubscriptionNow(subscriptionId: string): Promise<void> {
  try {
    await getStripe().subscriptions.cancel(subscriptionId);
  } catch (err: any) {
    // Already cancelled / gone on Stripe's side is the outcome we want.
    if (err?.code === 'resource_missing' || err?.statusCode === 404) return;
    throw err;
  }
}

// ---- Keeping the database in step with Stripe ------------------------------------------------

const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);
const ENDED_STATUSES = new Set(['canceled', 'incomplete_expired', 'unpaid']);

/**
 * Apply a Stripe subscription to the account that owns it. The subscription is the source of
 * truth, so this is safe to run any number of times and in any order.
 */
export async function applySubscription(sub: any): Promise<void> {
  const customerId: string | undefined = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const userId: string | undefined = sub.metadata?.userId;
  const user = await prisma.user.findFirst({
    where: { OR: [...(customerId ? [{ stripeCustomerId: customerId }] : []), ...(userId ? [{ id: userId }] : [])] }
  });
  if (!user) {
    console.error(`[billing] subscription ${sub.id} matches no account (customer ${customerId})`);
    return;
  }

  const item = sub.items?.data?.[0];
  const priceId: string | undefined = item?.price?.id;
  const mapped = priceId ? planForPriceId(priceId) : null;
  const entitled = ENTITLED_STATUSES.has(sub.status);

  if (entitled && !mapped) {
    // A price we do not recognise must not silently downgrade someone who is paying.
    console.error(`[billing] subscription ${sub.id} uses unknown price ${priceId}; leaving plan unchanged`);
    return;
  }

  const ended = ENDED_STATUSES.has(sub.status);
  const periodEnd: number | undefined = item?.current_period_end ?? sub.current_period_end;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId ?? user.stripeCustomerId,
      stripeSubscriptionId: ended ? null : sub.id,
      plan: entitled && mapped ? mapped.plan : 'FREE',
      planStatus: sub.status,
      planInterval: entitled && mapped ? mapped.interval : null,
      currentPeriodEnd: entitled && periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: entitled ? !!(sub.cancel_at_period_end || sub.cancel_at) : false
    }
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session: any = event.data.object;
      if (session.mode !== 'subscription' || !session.subscription) return;
      const subId: string = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
      const customerId: string | undefined = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (session.client_reference_id && customerId) {
        // Link the Stripe customer to the account that started checkout before syncing.
        await prisma.user.updateMany({ where: { id: session.client_reference_id, stripeCustomerId: null }, data: { stripeCustomerId: customerId } });
      }
      await applySubscription(await getStripe().subscriptions.retrieve(subId));
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub: any = event.data.object;
      // Ask Stripe for the current state rather than trusting event order.
      let fresh: any = sub;
      try { fresh = await getStripe().subscriptions.retrieve(sub.id); } catch { /* fall back to the event's copy */ }
      await applySubscription(fresh);
      return;
    }
    default:
      return;
  }
}

export type { PlanId };
export { isPaidPlan };
