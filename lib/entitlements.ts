import { prisma } from './db';
import { billingEnabled } from './billing';
import { PLANS, isPlanId, type PlanDef, type PlanId } from '../src/plans';

export interface Entitlement {
  plan: PlanId;
  def: PlanDef;
  /** False while billing is not configured: limits are then not enforced at all. */
  enforced: boolean;
  comped: boolean;
}

/** Accounts listed in COMPED_EMAILS get the Agency plan without a subscription (owner, testers, partners). */
export function isComped(email: string): boolean {
  const list = (process.env.COMPED_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function entitlementFor(user: { email: string; plan: string }): Entitlement {
  if (!billingEnabled()) return { plan: 'AGENCY', def: PLANS.AGENCY, enforced: false, comped: false };
  if (isComped(user.email)) return { plan: 'AGENCY', def: PLANS.AGENCY, enforced: true, comped: true };
  const plan: PlanId = isPlanId(user.plan) ? user.plan : 'FREE';
  return { plan, def: PLANS[plan], enforced: true, comped: false };
}

export async function entitlementForUserId(userId: string): Promise<Entitlement | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, plan: true } });
  return user ? entitlementFor(user) : null;
}

/** Manual (non-monitor) scans in the last 30 days: what the plan allowance is measured against. */
export async function scansInLast30Days(userId: string): Promise<number> {
  return prisma.scan.count({
    where: { userId, monitorId: null, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
  });
}

export interface PlanDenial {
  status: number;
  body: { error: string; code: 'PLAN_REQUIRED' | 'PLAN_LIMIT'; requiredPlan?: PlanId };
}

const pathTo = 'Open the Billing tab to upgrade.';

/** Returns the denial to send, or null when the account may proceed. Never denies when not enforced. */
export function denyFeature(ent: Entitlement, feature: 'deepCrawl' | 'apiKeys' | 'widget' | 'whiteLabel'): PlanDenial | null {
  if (!ent.enforced || ent.def[feature]) return null;
  const label = { deepCrawl: 'Deep site crawls', apiKeys: 'API keys', widget: 'The lead-capture widget', whiteLabel: 'White-label reports' }[feature];
  const requiredPlan: PlanId = feature === 'apiKeys' || feature === 'widget' ? 'AGENCY' : 'STARTER';
  return { status: 403, body: { error: `${label} ${feature === 'deepCrawl' || feature === 'whiteLabel' ? 'are' : 'is'} available on the ${PLANS[requiredPlan].name} plan and above. ${pathTo}`, code: 'PLAN_REQUIRED', requiredPlan } };
}

export function denyMonitors(ent: Entitlement, current: number): PlanDenial | null {
  if (!ent.enforced || current < ent.def.monitors) return null;
  if (ent.def.monitors === 0) {
    return { status: 403, body: { error: `Scheduled monitors are available on the Starter plan and above. ${pathTo}`, code: 'PLAN_REQUIRED', requiredPlan: 'STARTER' } };
  }
  const next: PlanId | undefined = ent.plan === 'STARTER' ? 'AGENCY' : undefined;
  return { status: 403, body: { error: `Your ${ent.def.name} plan includes ${ent.def.monitors} monitors. ${next ? pathTo : 'Remove one to add another.'}`, code: 'PLAN_LIMIT', requiredPlan: next } };
}

export function denyScanQuota(ent: Entitlement, usedInWindow: number): PlanDenial | null {
  if (!ent.enforced || usedInWindow < ent.def.scansPer30Days) return null;
  const next: PlanId | undefined = ent.plan === 'FREE' ? 'STARTER' : ent.plan === 'STARTER' ? 'AGENCY' : undefined;
  return {
    status: 429,
    body: {
      error: `You have used all ${ent.def.scansPer30Days} audits included in the ${ent.def.name} plan for the last 30 days.${next ? ` ${pathTo}` : ' Older audits roll out of the window each day.'}`,
      code: 'PLAN_LIMIT',
      requiredPlan: next
    }
  };
}

/** Report branding: paid white-label plans use the account's saved branding, everyone else gets ours. */
export function brandedSettings<T extends Record<string, any>>(settings: T, ent: Entitlement): T {
  if (!ent.enforced || ent.def.whiteLabel) return settings;
  return { ...settings, agencyName: 'SEO Scan Pro', logoUrl: null, primaryColor: '#0ea5e9', accentColor: '#1e40af', customFooter: 'Report provided by SEO Scan Pro' };
}
