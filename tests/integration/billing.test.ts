import { describe, it, expect, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import Stripe from 'stripe';

vi.mock('../../lib/scanRunner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/scanRunner')>();
  return { ...actual, queueScan: vi.fn() };
});

import { createApp } from '../../server';
import { prisma } from '../../lib/db';
import { setStripeClientForTests } from '../../lib/billing';

const app = createApp();
const SECRET = 'whsec_test_secret';
const realStripe = new Stripe('sk_test_123');

const ENV: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: SECRET,
  STRIPE_PRICE_STARTER_MONTHLY: 'price_starter_m',
  STRIPE_PRICE_STARTER_YEARLY: 'price_starter_y',
  STRIPE_PRICE_AGENCY_MONTHLY: 'price_agency_m',
  STRIPE_PRICE_AGENCY_YEARLY: 'price_agency_y'
};

let fake: any;
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const email = (l: string) => `test-billing-${l}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

function enableBilling() {
  Object.assign(process.env, ENV);
  fake = {
    webhooks: realStripe.webhooks, // real signature verification
    customers: { create: vi.fn().mockImplementation(async (a: any) => ({ id: `cus_${a.metadata.userId}` })) },
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.test/session' }) } },
    billingPortal: { sessions: { create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.test/portal' }) } },
    subscriptions: { retrieve: vi.fn(), cancel: vi.fn().mockResolvedValue({}) }
  };
  setStripeClientForTests(fake);
}

beforeEach(() => enableBilling());
afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
  delete process.env.COMPED_EMAILS;
  setStripeClientForTests(null);
});
afterAll(async () => {
  await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: 'evt_test_' } } });
  await prisma.user.deleteMany({ where: { email: { contains: 'test-billing-' } } });
  await prisma.$disconnect();
});

async function signUp(label: string) {
  const reg = await request(app).post('/api/auth/register').send({ email: email(label), password: 'original-pw1' });
  return { token: reg.body.token as string, id: reg.body.user.id as string, email: reg.body.user.email as string };
}

function subscription(userId: string, price: string, over: Record<string, any> = {}) {
  return {
    id: `sub_${userId}`, customer: `cus_${userId}`, status: 'active', cancel_at_period_end: false, metadata: { userId },
    items: { data: [{ price: { id: price }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] }, ...over
  };
}

async function sendEvent(type: string, object: any, id = `evt_test_${Math.random().toString(36).slice(2)}`) {
  const payload = JSON.stringify({ id, object: 'event', type, data: { object } });
  const header = realStripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return request(app).post('/api/stripe/webhook').set('Content-Type', 'application/json').set('Stripe-Signature', header).send(payload);
}

describe('billing switched off', () => {
  it('enforces nothing and hides the webhook when Stripe is not configured', async () => {
    for (const k of Object.keys(ENV)) delete process.env[k];
    const u = await signUp('off');
    const status = await request(app).get('/api/billing').set(auth(u.token));
    expect(status.body.enabled).toBe(false);
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'https://8.8.8.8', frequency: 'WEEKLY', alertThreshold: 5 })).status).toBe(201);
    expect((await request(app).post('/api/billing/checkout').set(auth(u.token)).send({ plan: 'STARTER', interval: 'month' })).status).toBe(503);
    expect((await request(app).post('/api/stripe/webhook').send('{}')).status).toBe(404);
  });
});

describe('free plan limits (billing on)', () => {
  it('blocks deep crawls, monitors, API keys and the widget, and locks branding', async () => {
    const u = await signUp('free');
    const deep = await request(app).post('/api/scan').set(auth(u.token)).send({ url: 'https://8.8.8.8', mode: 'FULL_SITE', depth: 2 });
    expect(deep.status).toBe(403);
    expect(deep.body.code).toBe('PLAN_REQUIRED');
    expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'https://8.8.8.8', frequency: 'WEEKLY', alertThreshold: 5 })).body.code).toBe('PLAN_REQUIRED');
    expect((await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'ci' })).body.code).toBe('PLAN_REQUIRED');

    const settings = await request(app).get('/api/settings').set(auth(u.token));
    expect(settings.body.brandingLocked).toBe(true);
    expect(settings.body.agencyName).toBe('SeoScan');

    const key = (await prisma.user.findUnique({ where: { id: u.id } }))!.widgetKey;
    const widget = await request(app).post('/api/widget/scan').send({ url: 'https://8.8.8.8', email: 'p@example.com', name: 'P', widgetKey: key });
    expect(widget.status).toBe(403);
  });

  it('allows 3 single-page audits per 30 days and refuses the 4th', async () => {
    const u = await signUp('quota');
    await prisma.scan.createMany({ data: [1, 2, 3].map((n) => ({ url: `https://8.8.8.8/${n}`, status: 'COMPLETED', userId: u.id })) });
    const res = await request(app).post('/api/scan').set(auth(u.token)).send({ url: 'https://8.8.8.8/4' });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('PLAN_LIMIT');
    expect(res.body.error).toMatch(/3 audits/);
  });

  it('counts only the last 30 days', async () => {
    const u = await signUp('window');
    await prisma.scan.createMany({ data: [1, 2, 3].map((n) => ({ url: `https://8.8.8.8/old${n}`, status: 'COMPLETED', userId: u.id, createdAt: new Date(Date.now() - 31 * 86400 * 1000) })) });
    const res = await request(app).post('/api/scan').set(auth(u.token)).send({ url: 'https://8.8.8.8/new' });
    expect(res.status).toBe(202);
  });
});

describe('checkout', () => {
  it('creates a hosted Checkout session for the chosen price and remembers the customer', async () => {
    const u = await signUp('checkout');
    const res = await request(app).post('/api/billing/checkout').set(auth(u.token)).send({ plan: 'STARTER', interval: 'year' });
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout.stripe.test/session');
    const args = fake.checkout.sessions.create.mock.calls[0][0];
    expect(args.mode).toBe('subscription');
    expect(args.line_items).toEqual([{ price: 'price_starter_y', quantity: 1 }]);
    expect(args.client_reference_id).toBe(u.id);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.stripeCustomerId).toBe(`cus_${u.id}`);
  });

  it('rejects a bad plan, and a second subscription', async () => {
    const u = await signUp('checkout2');
    expect((await request(app).post('/api/billing/checkout').set(auth(u.token)).send({ plan: 'GOLD', interval: 'month' })).status).toBe(400);
    await prisma.user.update({ where: { id: u.id }, data: { stripeSubscriptionId: 'sub_existing' } });
    const again = await request(app).post('/api/billing/checkout').set(auth(u.token)).send({ plan: 'AGENCY', interval: 'month' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('HAS_SUBSCRIPTION');
  });

  it('opens the customer portal only for accounts that have a billing record', async () => {
    const u = await signUp('portal');
    expect((await request(app).post('/api/billing/portal').set(auth(u.token))).status).toBe(409);
    await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: `cus_${u.id}` } });
    const res = await request(app).post('/api/billing/portal').set(auth(u.token));
    expect(res.body.url).toBe('https://billing.stripe.test/portal');
  });
});

describe('webhook', () => {
  it('rejects a request with a bad signature', async () => {
    const res = await request(app).post('/api/stripe/webhook').set('Content-Type', 'application/json').set('Stripe-Signature', 't=1,v1=deadbeef').send('{"id":"evt_test_bad"}');
    expect(res.status).toBe(400);
  });

  it('upgrades the account on a new subscription, and is idempotent', async () => {
    const u = await signUp('hook');
    await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: `cus_${u.id}` } });
    const sub = subscription(u.id, 'price_agency_y');
    fake.subscriptions.retrieve.mockResolvedValue(sub);

    const first = await sendEvent('customer.subscription.created', sub, 'evt_test_dup');
    expect(first.status).toBe(200);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after!.plan).toBe('AGENCY');
    expect(after!.planInterval).toBe('year');
    expect(after!.stripeSubscriptionId).toBe(`sub_${u.id}`);
    expect(after!.currentPeriodEnd).toBeTruthy();

    fake.subscriptions.retrieve.mockClear();
    const again = await sendEvent('customer.subscription.created', sub, 'evt_test_dup');
    expect(again.body.duplicate).toBe(true);
    expect(fake.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it('links the customer from checkout.session.completed and unlocks the plan', async () => {
    const u = await signUp('session');
    const sub = subscription(u.id, 'price_starter_m');
    fake.subscriptions.retrieve.mockResolvedValue(sub);
    const res = await sendEvent('checkout.session.completed', { mode: 'subscription', client_reference_id: u.id, customer: `cus_${u.id}`, subscription: `sub_${u.id}` });
    expect(res.status).toBe(200);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after!.plan).toBe('STARTER');
    expect(after!.stripeCustomerId).toBe(`cus_${u.id}`);
  });

  it('drops the account back to Free when the subscription ends', async () => {
    const u = await signUp('cancel');
    await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: `cus_${u.id}`, plan: 'AGENCY', stripeSubscriptionId: `sub_${u.id}` } });
    const ended = subscription(u.id, 'price_agency_m', { status: 'canceled' });
    fake.subscriptions.retrieve.mockResolvedValue(ended);
    await sendEvent('customer.subscription.deleted', ended);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after!.plan).toBe('FREE');
    expect(after!.stripeSubscriptionId).toBeNull();
  });

  it('keeps a paying customer on their plan if the price is unrecognised', async () => {
    const u = await signUp('unknown');
    await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: `cus_${u.id}`, plan: 'STARTER' } });
    const odd = subscription(u.id, 'price_something_else');
    fake.subscriptions.retrieve.mockResolvedValue(odd);
    await sendEvent('customer.subscription.updated', odd);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.plan).toBe('STARTER');
  });

  it('flags a cancel-at-period-end subscription but keeps access until it ends', async () => {
    const u = await signUp('pending');
    await prisma.user.update({ where: { id: u.id }, data: { stripeCustomerId: `cus_${u.id}` } });
    const sub = subscription(u.id, 'price_starter_m', { cancel_at_period_end: true });
    fake.subscriptions.retrieve.mockResolvedValue(sub);
    await sendEvent('customer.subscription.updated', sub);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after!.plan).toBe('STARTER');
    expect(after!.cancelAtPeriodEnd).toBe(true);
  });
});

describe('what each paid plan unlocks', () => {
  it('Starter: deep crawl and 3 monitors, but no API keys or widget', async () => {
    const u = await signUp('starter');
    await prisma.user.update({ where: { id: u.id }, data: { plan: 'STARTER' } });
    expect((await request(app).post('/api/scan').set(auth(u.token)).send({ url: 'https://8.8.8.8', mode: 'FULL_SITE', depth: 2 })).status).toBe(202);
    for (let i = 0; i < 3; i++) {
      expect((await request(app).post('/api/monitors').set(auth(u.token)).send({ url: `https://8.8.8.${i + 1}`, frequency: 'WEEKLY', alertThreshold: 5 })).status).toBe(201);
    }
    const fourth = await request(app).post('/api/monitors').set(auth(u.token)).send({ url: 'https://8.8.8.9', frequency: 'WEEKLY', alertThreshold: 5 });
    expect(fourth.status).toBe(403);
    expect(fourth.body.requiredPlan).toBe('AGENCY');
    expect((await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'ci' })).status).toBe(403);
    expect((await request(app).get('/api/settings').set(auth(u.token))).body.brandingLocked).toBeUndefined();
  });

  it('Agency: API keys and the widget', async () => {
    const u = await signUp('agency');
    await prisma.user.update({ where: { id: u.id }, data: { plan: 'AGENCY' } });
    expect((await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'ci' })).status).toBe(201);
    const key = (await prisma.user.findUnique({ where: { id: u.id } }))!.widgetKey;
    const widget = await request(app).post('/api/widget/scan').send({ url: 'https://8.8.8.8', email: 'p@example.com', name: 'P', widgetKey: key });
    expect(widget.status).not.toBe(403);
  });

  it('COMPED_EMAILS get full access without a subscription', async () => {
    const u = await signUp('comped');
    process.env.COMPED_EMAILS = `someone@else.com, ${u.email.toUpperCase()}`;
    const status = await request(app).get('/api/billing').set(auth(u.token));
    expect(status.body.plan).toBe('AGENCY');
    expect(status.body.comped).toBe(true);
    expect((await request(app).post('/api/api-keys').set(auth(u.token)).send({ name: 'ci' })).status).toBe(201);
  });
});

describe('deleting an account', () => {
  it('cancels the subscription first', async () => {
    const u = await signUp('delete');
    await prisma.user.update({ where: { id: u.id }, data: { stripeSubscriptionId: 'sub_to_cancel', plan: 'STARTER' } });
    const res = await request(app).delete('/api/auth/account').set(auth(u.token)).send({ currentPassword: 'original-pw1' });
    expect(res.status).toBe(200);
    expect(fake.subscriptions.cancel).toHaveBeenCalledWith('sub_to_cancel');
    expect(await prisma.user.findUnique({ where: { id: u.id } })).toBeNull();
  });

  it('refuses to delete if the subscription cannot be cancelled, so nobody is billed for a ghost account', async () => {
    const u = await signUp('delete2');
    await prisma.user.update({ where: { id: u.id }, data: { stripeSubscriptionId: 'sub_stuck', plan: 'STARTER' } });
    fake.subscriptions.cancel.mockRejectedValue(new Error('stripe down'));
    const res = await request(app).delete('/api/auth/account').set(auth(u.token)).send({ currentPassword: 'original-pw1' });
    expect(res.status).toBe(502);
    expect(await prisma.user.findUnique({ where: { id: u.id } })).not.toBeNull();
  });
});
