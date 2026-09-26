import { AgentReadyPrompt, DeepSeekSeoReport } from './types';

export interface AgentPromptInput {
  url: string;
  score?: Partial<DeepSeekSeoReport['score']> | null;
  criticalIssues?: string[] | null;
  recommendedFixes?: DeepSeekSeoReport['recommendedFixes'] | null;
  aeoAssessment?: DeepSeekSeoReport['aeoAssessment'] | null;
  isSimulated?: boolean;
  /** Executive summary, when available, to give the agent the audit's own framing. */
  executiveSummary?: string | null;
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const VALID_CATEGORIES = new Set(['technical', 'content', 'aeo-geo', 'performance']);

function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url || 'the target site';
  }
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/**
 * Builds the "agent-ready prompt": a self-contained instruction block a developer can paste
 * directly into a coding agent (Claude Code, Cursor, Copilot, …) to have the audited issues
 * implemented in their own codebase.
 *
 * Everything it consumes originates as unvalidated LLM JSON (or a report stored by an older
 * version of the app), so every field is coerced here rather than trusted. A single missing
 * key previously threw during React render, which unmounts the tree and leaves a blank page.
 *
 * Intentionally dependency-free so the exact same output can be produced:
 *   - on the server, as the deterministic fallback when DeepSeek is unavailable or omits the
 *     field, and
 *   - in the browser, for scans stored before this feature existed.
 */
export function buildAgentReadyPrompt(input: AgentPromptInput): AgentReadyPrompt {
  const { url, executiveSummary, isSimulated } = input;

  const host = displayHost(url);

  const score = {
    overall: Number(input.score?.overall) || 0,
    technical: Number(input.score?.technical) || 0,
    content: Number(input.score?.content) || 0,
    aeoGeo: Number(input.score?.aeoGeo) || 0,
    performance: Number(input.score?.performance) || 0
  };

  const criticalIssues = (Array.isArray(input.criticalIssues) ? input.criticalIssues : []).filter(
    (issue): issue is string => typeof issue === 'string' && issue.trim().length > 0
  );

  const tasks = (Array.isArray(input.recommendedFixes) ? input.recommendedFixes : [])
    .filter((fix): fix is NonNullable<typeof fix> => !!fix && typeof fix === 'object')
    .map((fix) => ({
      title: str(fix.title, 'Untitled fix'),
      category: VALID_CATEGORIES.has(fix.category) ? fix.category : 'technical',
      priority: PRIORITY_ORDER[fix.priority] !== undefined ? fix.priority : 'medium',
      description: str(fix.description, 'No description provided.'),
      remediation: str(fix.remediation, 'No remediation steps provided.')
    }))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  const aeoRecommendations = (Array.isArray(input.aeoAssessment?.recommendationsForAeo)
    ? input.aeoAssessment!.recommendationsForAeo
    : []
  ).filter((rec): rec is string => typeof rec === 'string' && rec.trim().length > 0);

  const title = `Fix ${tasks.length || 'the'} SEO issue${tasks.length === 1 ? '' : 's'} found on ${host}`;

  const out: string[] = [];
  out.push(`You are working on the codebase that serves the website ${url || host}.`);
  out.push('');
  out.push('CONTEXT');
  out.push(
    `An automated SEO / AEO audit of the live site scored it ${score.overall}/100 ` +
      `(technical ${score.technical}, content ${score.content}, AEO-GEO ${score.aeoGeo}, performance ${score.performance}). ` +
      `These findings describe the DEPLOYED site, so first map each one to the template, component, config or build step ` +
      `that renders it — the fix belongs there, not in the rendered output.`
  );

  if (isSimulated) {
    out.push('');
    out.push(
      'NOTE: the target site could not be reached during the audit, so these findings come from placeholder data. ' +
        'Re-verify each item against the real site before acting on it.'
    );
  }

  if (executiveSummary) {
    out.push('');
    out.push('AUDIT SUMMARY');
    out.push(executiveSummary);
  }

  if (criticalIssues.length) {
    out.push('');
    out.push('CRITICAL ISSUES');
    criticalIssues.forEach((issue, i) => out.push(`${i + 1}. ${issue}`));
  }

  if (tasks.length) {
    out.push('');
    out.push('TASKS (highest priority first)');
    tasks.forEach((fix, i) => {
      out.push('');
      out.push(`${i + 1}. [${fix.priority.toUpperCase()} · ${fix.category}] ${fix.title}`);
      out.push(`   Problem: ${fix.description}`);
      out.push(`   Change: ${fix.remediation}`);
    });
  }

  if (aeoRecommendations.length) {
    out.push('');
    out.push('ADDITIONAL AEO / GENERATIVE-SEARCH ITEMS');
    aeoRecommendations.forEach((rec, i) => out.push(`${i + 1}. ${rec}`));
  }

  out.push('');
  out.push('RULES');
  out.push('- Keep the existing framework, routing, and build setup.');
  out.push('- Do not change the visual design or marketing copy unless a task explicitly requires it.');
  out.push('- Prefer the smallest change that satisfies each task; do not refactor unrelated code.');
  out.push('- If a task needs content or business facts you do not have, ask instead of inventing them.');
  out.push('- After each task, state which file(s) you changed and why.');

  out.push('');
  out.push('DEFINITION OF DONE');
  tasks.forEach((fix) => out.push(`- [ ] ${fix.title} — implemented and verifiable in the rendered HTML`));
  out.push('- [ ] Re-run the audit on the deployed site and confirm the affected scores improved.');

  return { title, prompt: out.join('\n'), checklist: tasks.map((fix) => fix.title) };
}
