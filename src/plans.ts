// Plans and their limits. One file, imported by both the server (enforcement) and the UI (pricing
// cards, usage meters), so what is promised on the page can never drift from what is enforced.
// Prices are what the Stripe Prices must be created with (see DEPLOYMENT.md).

export type PlanId = 'FREE' | 'STARTER' | 'AGENCY';
export type BillingInterval = 'month' | 'year';

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  /** USD per month when billed monthly. */
  priceMonthly: number;
  /** USD for a full year when billed annually (20% off twelve months). */
  priceYearly: number;
  /** Manual scans allowed in any rolling 30 days. Monitor re-scans are limited by `monitors` instead. */
  scansPer30Days: number;
  deepCrawl: boolean;
  monitors: number;
  apiKeys: boolean;
  /** The embeddable lead-capture widget. */
  widget: boolean;
  /** Custom agency name, colours, logo and footer on reports. */
  whiteLabel: boolean;
  highlights: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  FREE: {
    id: 'FREE', name: 'Free', tagline: 'Try a real audit', priceMonthly: 0, priceYearly: 0,
    scansPer30Days: 3, deepCrawl: false, monitors: 0, apiKeys: false, widget: false, whiteLabel: false,
    highlights: ['3 single-page audits every 30 days', 'Full AI report and fix checklist', 'PDF and HTML download', 'SeoScan branding on reports']
  },
  STARTER: {
    id: 'STARTER', name: 'Starter', tagline: 'For freelancers and site owners', priceMonthly: 24, priceYearly: 230,
    scansPer30Days: 100, deepCrawl: true, monitors: 3, apiKeys: false, widget: false, whiteLabel: true,
    highlights: ['100 audits every 30 days', 'Deep site crawls (up to 5 pages)', 'White-label reports: your name, colours, logo', '3 scheduled monitors with score-drop alerts']
  },
  AGENCY: {
    id: 'AGENCY', name: 'Agency', tagline: 'Turn audits into clients', priceMonthly: 49, priceYearly: 470,
    scansPer30Days: 500, deepCrawl: true, monitors: 25, apiKeys: true, widget: true, whiteLabel: true,
    highlights: ['500 audits every 30 days', 'Embeddable lead-capture widget', '25 scheduled monitors and webhooks', 'API keys and CSV/JSON export']
  }
};

export const PLAN_ORDER: PlanId[] = ['FREE', 'STARTER', 'AGENCY'];
export const PAID_PLANS: PlanId[] = ['STARTER', 'AGENCY'];

export function isPlanId(v: unknown): v is PlanId {
  return v === 'FREE' || v === 'STARTER' || v === 'AGENCY';
}

export function isPaidPlan(v: unknown): v is 'STARTER' | 'AGENCY' {
  return v === 'STARTER' || v === 'AGENCY';
}

/** Effective per-month price of the annual plan, for "$19.17/mo billed yearly" style labels. */
export function yearlyPerMonth(plan: PlanDef): number {
  return Math.round((plan.priceYearly / 12) * 100) / 100;
}

/** How much a year saves against twelve monthly payments, as a whole percent. */
export function yearlySavingsPercent(plan: PlanDef): number {
  if (!plan.priceMonthly) return 0;
  return Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100);
}
