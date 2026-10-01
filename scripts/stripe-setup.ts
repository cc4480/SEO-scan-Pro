/**
 * One-time Stripe setup. Creates the Starter and Agency products with monthly and yearly prices
 * (amounts come from src/plans.ts, so Stripe can never disagree with the pricing page) and,
 * optionally, the webhook endpoint. Safe to re-run: prices are found again by lookup key.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup -- --webhook-url=https://your-app.example.com/api/stripe/webhook
 *
 * Use a test-mode key first, then repeat with the live key. It prints the environment variables
 * to set on the server; billing switches on once all of them are present.
 */
import Stripe from 'stripe';
import { PLANS } from '../src/plans';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY first (a test key starts with sk_test_).');
  process.exit(1);
}
const stripe = new Stripe(key);
const webhookUrl = process.argv.find((a) => a.startsWith('--webhook-url='))?.split('=')[1];

async function ensurePrice(plan: 'STARTER' | 'AGENCY', interval: 'month' | 'year'): Promise<string> {
  const def = PLANS[plan];
  const lookupKey = `seo_scan_pro_${plan.toLowerCase()}_${interval}ly`;
  const cents = Math.round((interval === 'month' ? def.priceMonthly : def.priceYearly) * 100);

  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (existing.data[0]) {
    const p = existing.data[0];
    if (p.unit_amount !== cents) {
      console.warn(`! ${lookupKey}: Stripe has ${p.unit_amount}¢ but plans.ts says ${cents}¢. Prices are immutable in Stripe; create a new one (and archive this) if you changed the amount.`);
    }
    return p.id;
  }

  // Reuse the product across a plan's two prices.
  const products = await stripe.products.search({ query: `metadata['app']:'seo-scan-pro' AND metadata['plan']:'${plan}'`, limit: 1 });
  const product = products.data[0] ?? (await stripe.products.create({
    name: `SEO Scan Pro ${def.name}`,
    description: def.tagline,
    metadata: { app: 'seo-scan-pro', plan }
  }));

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: cents,
    recurring: { interval },
    lookup_key: lookupKey
  });
  return price.id;
}

async function main() {
  const ids = {
    STRIPE_PRICE_STARTER_MONTHLY: await ensurePrice('STARTER', 'month'),
    STRIPE_PRICE_STARTER_YEARLY: await ensurePrice('STARTER', 'year'),
    STRIPE_PRICE_AGENCY_MONTHLY: await ensurePrice('AGENCY', 'month'),
    STRIPE_PRICE_AGENCY_YEARLY: await ensurePrice('AGENCY', 'year')
  };

  let webhookSecret = '<create the webhook, then paste its signing secret here>';
  if (webhookUrl) {
    const events = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'] as Stripe.WebhookEndpointCreateParams.EnabledEvent[];
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const found = endpoints.data.find((e) => e.url === webhookUrl);
    if (found) {
      webhookSecret = '<already exists: reveal its signing secret in Developers > Webhooks>';
      console.log(`Webhook endpoint already exists for ${webhookUrl} (${found.id}).`);
    } else {
      const created = await stripe.webhookEndpoints.create({ url: webhookUrl, enabled_events: events });
      webhookSecret = created.secret ?? webhookSecret;
      console.log(`Created webhook endpoint ${created.id}.`);
    }
  } else {
    console.log('No --webhook-url given: create the endpoint yourself (events: checkout.session.completed, customer.subscription.created/updated/deleted).');
  }

  console.log('\nSet these on the server (Railway > web > Variables), plus STRIPE_SECRET_KEY:\n');
  for (const [k, v] of Object.entries(ids)) console.log(`${k}=${v}`);
  console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
  console.log('\nAlso: enable the Customer Portal (Settings > Billing > Customer portal) so people can cancel and update cards.');
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
