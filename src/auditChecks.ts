import {
  Target, FileText, Globe, Tags, Heading1, Image as ImageIcon,
  Link2, Braces, Gauge, Sparkles, Bot, FileSearch, ShieldCheck, type LucideIcon
} from 'lucide-react';

/** Colour-coded log channel, like the tags in a build log. */
export type AuditTag = 'NET' | 'CRAWL' | 'PARSE' | 'SEO' | 'AEO' | 'SEC' | 'PERF' | 'AI';

export interface AuditCheck {
  /** Matches the `stage` the server emits on its progress events (lib/crawler.ts, lib/deepseek.ts). */
  id: string;
  label: string;
  Icon: LucideIcon;
  tag: AuditTag;
}

/**
 * The stages the audit pipeline reports on, in display order. This list only names and colours
 * the stages; everything shown under each one comes from real events the server emitted while
 * doing the work (see ProgressEvent in types.ts), never from this file.
 */
export const AUDIT_CHECKS: AuditCheck[] = [
  { id: 'url',      tag: 'NET',   label: 'Resolve & validate target',   Icon: Target },
  { id: 'robots',   tag: 'NET',   label: 'robots.txt & sitemap',        Icon: FileText },
  { id: 'llms',     tag: 'AEO',   label: 'AI-crawler directives',       Icon: Bot },
  { id: 'render',   tag: 'CRAWL', label: 'Render the page',             Icon: Globe },
  { id: 'meta',     tag: 'PARSE', label: 'Meta tags & canonical',       Icon: Tags },
  { id: 'headings', tag: 'PARSE', label: 'Headings & content depth',    Icon: Heading1 },
  { id: 'images',   tag: 'PARSE', label: 'Images & alt text',           Icon: ImageIcon },
  { id: 'links',    tag: 'PARSE', label: 'Links & broken-link sample',  Icon: Link2 },
  { id: 'schema',   tag: 'SEO',   label: 'Structured data (JSON-LD)',   Icon: Braces },
  { id: 'security', tag: 'SEC',   label: 'Security headers & HTTPS',    Icon: ShieldCheck },
  { id: 'perf',     tag: 'PERF',  label: 'Performance, TTFB & vitals',  Icon: Gauge },
  { id: 'ai',       tag: 'AI',    label: 'DeepSeek analysis',           Icon: Sparkles },
  { id: 'prompt',   tag: 'AI',    label: 'Agent-ready prompt',          Icon: FileSearch }
];
