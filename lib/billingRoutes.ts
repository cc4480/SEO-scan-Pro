import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from './db';
import { authMiddleware, requireSession, type AuthRequest } from './authMiddleware';
import { requireVerifiedEmail } from './emailVerification';
import { billingEnabled, createCheckoutSession, createPortalSession, getStripe, handleStripeEvent } from './billing';
import { entitlementFor, scansInLast30Days } from './entitlements';

const isTestEnv = process.env.NODE_ENV === 'test';

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTestEnv ? 100000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many billing requests. Please try again shortly.' }
});

/**
 * Stripe calls this when a subscription changes. It must be mounted BEFORE express.json(): the
 * signature is computed over the exact raw bytes, and a re-serialised body would never verify.
 */
export function mountStripeWebhook(app: Express): void {
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res) => {
    if (!billingEnabled()) return res.status(404).json({ error: 'Not found' });

    let event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, String(req.headers['stripe-signature'] || ''), process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Stripe retries and can deliver an event twice. Claim the id first; a duplicate stops here.
    try {
      await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
    } catch (err: any) {
      if (err?.code === 'P2002') return res.json({ received: true, duplicate: true });
      console.error('[billing] could not record event', err);
      return res.status(500).json({ error: 'Could not record event' });
    }

    try {
      await handleStripeEvent(event);
      res.json({ received: true });
    } catch (err) {
      // Release the claim so Stripe's retry is processed rather than skipped as a duplicate.
      await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
      console.error(`[billing] failed handling ${event.type} ${event.id}:`, err);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  });
}

const checkoutSchema = z.object({
  plan: z.enum(['STARTER', 'AGENCY']),
  interval: z.enum(['month', 'year'])
});

export function mountBillingRoutes(app: Express): void {
  app.get('/api/billing', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const ent = entitlementFor(user);
      const [scans30d, monitors] = await Promise.all([
        scansInLast30Days(user.id),
        prisma.monitor.count({ where: { userId: user.id } })
      ]);
      res.json({
        enabled: billingEnabled(),
        plan: ent.plan,
        comped: ent.comped,
        status: user.planStatus,
        interval: user.planInterval,
        currentPeriodEnd: user.currentPeriodEnd,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        canManage: !!user.stripeCustomerId,
        usage: { scans30d, scanLimit: ent.def.scansPer30Days, monitors, monitorLimit: ent.def.monitors },
        limits: ent.def
      });
    } catch (err) {
      console.error('Billing status error:', err);
      res.status(500).json({ error: 'Failed to load billing status' });
    }
  });

  app.post('/api/billing/checkout', authMiddleware, requireSession, requireVerifiedEmail, billingLimiter, async (req: AuthRequest, res) => {
    try {
      if (!billingEnabled()) return res.status(503).json({ error: 'Paid plans are not available yet.' });
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Choose a plan and a billing interval.' });

      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (entitlementFor(user).comped) return res.status(409).json({ error: 'Your account already has full access.' });
      // One subscription per account: changing plan happens in the portal, not by buying a second one.
      if (user.stripeSubscriptionId) return res.status(409).json({ error: 'You already have a subscription. Use Manage billing to change plan.', code: 'HAS_SUBSCRIPTION' });

      res.json({ url: await createCheckoutSession(user, parsed.data.plan, parsed.data.interval) });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(502).json({ error: 'Could not start checkout. Please try again.' });
    }
  });

  app.post('/api/billing/portal', authMiddleware, requireSession, billingLimiter, async (req: AuthRequest, res) => {
    try {
      if (!billingEnabled()) return res.status(503).json({ error: 'Billing is not available yet.' });
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user?.stripeCustomerId) return res.status(409).json({ error: 'There is no billing account to manage yet.' });
      res.json({ url: await createPortalSession(user) });
    } catch (err) {
      console.error('Portal error:', err);
      res.status(502).json({ error: 'Could not open billing. Please try again.' });
    }
  });
}
