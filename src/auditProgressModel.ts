import { AUDIT_CHECKS, type AuditCheck } from './auditChecks';
import type { ProgressEvent } from './types';

export type StageState = 'pending' | 'running' | 'ok' | 'warn' | 'fail';

export interface StageStatus {
  check: AuditCheck;
  state: StageState;
  /** The one-line result the server emitted when the stage finished. */
  summary: string;
}

export interface AuditProgressModel {
  stages: StageStatus[];
  completed: number;
  total: number;
  pct: number;
  /** Index of the stage currently running, or -1. */
  current: number;
  ended: boolean;
  failed: boolean;
}

/**
 * Folds the server's real progress events into per-stage state. Same rules the terminal log uses
 * (a stage is "running" once it has events but no `done`; its colour is its worst level), kept in
 * one place so every visual reads the scan the same way.
 */
export function buildAuditModel(events: ProgressEvent[], finished = false): AuditProgressModel {
  const byStage = new Map<string, ProgressEvent[]>();
  for (const e of events) {
    const list = byStage.get(e.stage);
    if (list) list.push(e);
    else byStage.set(e.stage, [e]);
  }

  const stages: StageStatus[] = AUDIT_CHECKS.map((check) => {
    const list = byStage.get(check.id);
    if (!list || list.length === 0) return { check, state: 'pending', summary: '' };
    const done = list.find((e) => e.level === 'done');
    const worst: StageState = list.some((e) => e.level === 'fail') ? 'fail' : list.some((e) => e.level === 'warn') ? 'warn' : 'ok';
    if (!done) return { check, state: finished ? worst : 'running', summary: '' };
    return { check, state: worst, summary: done.msg };
  });

  const lifecycle = byStage.get('scan') ?? [];
  const failed = lifecycle.some((e) => e.level === 'fail');
  const ended =
    finished || lifecycle.some((e) => (e.level === 'ok' || e.level === 'warn' || e.level === 'fail') && /audit finished|aborted/.test(e.msg));
  const completed = stages.filter((s) => s.state !== 'pending' && s.state !== 'running').length;
  const total = stages.length;
  return {
    stages,
    completed,
    total,
    pct: ended && !failed ? 100 : Math.round((completed / total) * 100),
    current: stages.findIndex((s) => s.state === 'running'),
    ended,
    failed
  };
}
