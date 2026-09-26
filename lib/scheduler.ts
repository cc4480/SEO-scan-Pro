import { prisma } from './db';
import { queueScan } from './scanRunner';

const FREQUENCY_MS: Record<string, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000
};

export function nextRunFrom(from: Date, frequency: string): Date {
  return new Date(from.getTime() + (FREQUENCY_MS[frequency] ?? FREQUENCY_MS.WEEKLY));
}

/**
 * Starts a scan for every active monitor whose nextRunAt has passed. Each monitor is claimed
 * with a conditional update before its scan is created, so two overlapping ticks (or two server
 * instances) cannot both run it. Returns how many scans were started.
 */
export async function runDueMonitors(now = new Date()): Promise<number> {
  const due = await prisma.monitor.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    take: 50,
    orderBy: { nextRunAt: 'asc' }
  });

  let started = 0;
  for (const monitor of due) {
    const claimed = await prisma.monitor.updateMany({
      where: { id: monitor.id, active: true, nextRunAt: monitor.nextRunAt },
      data: { lastRunAt: now, nextRunAt: nextRunFrom(now, monitor.frequency) }
    });
    if (claimed.count === 0) continue;

    const scan = await prisma.scan.create({
      data: { url: monitor.url, mode: 'SINGLE', depth: 1, status: 'PENDING', userId: monitor.userId, monitorId: monitor.id }
    });
    queueScan(scan.id, monitor.url, 'SINGLE', 1, monitor.userId);
    started++;
  }
  return started;
}

let timer: NodeJS.Timeout | null = null;

export function startScheduler(intervalMs = 60_000): void {
  if (timer) return;
  const tick = () => runDueMonitors().catch((err) => console.error('Monitor scheduler tick failed:', err));
  timer = setInterval(tick, intervalMs);
  timer.unref();
  tick();
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
