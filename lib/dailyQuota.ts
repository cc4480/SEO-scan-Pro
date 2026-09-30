import { prisma } from './db';

// Every manual scan launches headless Chromium and a billed DeepSeek call. The per-window rate
// limits stop bursts; this stops a slow drip from one account running up cost all day. Monitor
// re-scans are the account's own schedule and are not counted here.
export function dailyScanLimit(): number {
  const n = Number(process.env.DAILY_SCAN_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : 25;
}

export async function scansInLast24h(userId: string): Promise<number> {
  return prisma.scan.count({
    where: { userId, monitorId: null, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
}
