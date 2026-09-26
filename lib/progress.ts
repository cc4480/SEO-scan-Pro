// Live audit log. The crawler and the AI step emit one event per real thing they do (a request
// made, a value measured, a fallback taken); the UI streams them while the scan runs, and the
// full log is saved with the scan so the audit trail survives afterwards.
//
// Events describe what actually happened. Nothing here is estimated or scripted.

import type { ProgressEvent, ProgressLevel } from '../src/types';

export type { ProgressEvent, ProgressLevel };
export type Emit = (stage: string, level: ProgressLevel, msg: string) => void;

export const noopEmit: Emit = () => {};

const MAX_EVENTS = 400;
const MAX_MSG = 300;
const KEEP_AFTER_CLOSE_MS = 10 * 60 * 1000;

/**
 * Emits "still waiting" lines while a slow step runs, so a long wait reads as a running step and
 * not a frozen screen. Returns a function that stops it. Each line states how long has really passed.
 */
export function heartbeat(emit: Emit, stage: string, label: string, everyMs = 4000): () => void {
  const started = Date.now();
  const id = setInterval(() => emit(stage, 'info', `${label} (${Math.round((Date.now() - started) / 1000)}s so far)`), everyMs);
  return () => clearInterval(id);
}

/** Truncates text that came from the scanned site (titles, URLs, error bodies) before it is logged. */
export function clip(value: unknown, max = 80): string {
  const s = String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

interface Tracker {
  userId: string;
  startedAt: number;
  events: ProgressEvent[];
}

const live = new Map<string, Tracker>();

export interface Progress {
  emit: Emit;
  events: () => ProgressEvent[];
}

/** Idempotent: returns the existing tracker if the scan already has one (queued, then started). */
export function openProgress(scanId: string, userId: string): Progress {
  let tracker = live.get(scanId);
  if (!tracker) {
    tracker = { userId, startedAt: Date.now(), events: [] };
    live.set(scanId, tracker);
  }
  const t = tracker;
  const emit: Emit = (stage, level, msg) => {
    if (t.events.length >= MAX_EVENTS) return;
    t.events.push({ i: t.events.length, t: Date.now() - t.startedAt, stage, level, msg: clip(msg, MAX_MSG) });
  };
  return { emit, events: () => t.events };
}

/** Keeps the log readable for a while after the scan ends (late pollers), then frees the memory. */
export function closeProgress(scanId: string): void {
  const timer = setTimeout(() => live.delete(scanId), KEEP_AFTER_CLOSE_MS);
  timer.unref();
}

/** Events after index `after`, or null when this process holds no live log for the scan. */
export function getProgress(scanId: string, userId: string, after = 0): ProgressEvent[] | null {
  const tracker = live.get(scanId);
  if (!tracker || tracker.userId !== userId) return null;
  return tracker.events.slice(Math.max(0, after));
}
