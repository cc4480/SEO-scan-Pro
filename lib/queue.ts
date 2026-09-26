// In-process scan queue. Every scan drives a headless Chromium page and a billed AI call, so
// running them all at once (the old behaviour: fire-and-forget per request) lets a burst of
// requests exhaust memory. Jobs beyond the concurrency limit wait in FIFO order.
//
// Deliberately in-memory: this app is a single process. Jobs lost on restart are reconciled by
// recoverStuckScans() in lib/scanRunner.ts, which marks their rows FAILED instead of leaving
// them PENDING forever.

type Job = () => Promise<void>;

const waiting: Job[] = [];
let running = 0;

function limit(): number {
  const n = Number(process.env.SCAN_CONCURRENCY);
  return Number.isInteger(n) && n > 0 ? n : 2;
}

function pump(): void {
  while (running < limit() && waiting.length > 0) {
    const job = waiting.shift()!;
    running++;
    job()
      .catch((err) => console.error('Queued scan job threw:', err))
      .finally(() => {
        running--;
        pump();
      });
  }
}

export function enqueue(job: Job): void {
  waiting.push(job);
  pump();
}

export function queueStats(): { running: number; waiting: number; concurrency: number } {
  return { running, waiting: waiting.length, concurrency: limit() };
}
