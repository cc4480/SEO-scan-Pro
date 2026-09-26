export type ScanMode = 'SINGLE' | 'FULL_SITE';
export type ScanStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CrawlPageData {
  url: string;
  loadTimeMs: number;
  /**
   * Server response time as measured from the scanning host. Kept separate from `loadTimeMs` so
   * a slow/remote scanning host's network latency is not mistaken for the site's own performance,
   * and so the report can say "network-bound" instead of "your page is slow".
   */
  ttfbMs?: number;
  pageSizeKb: number;
  status: number;
  isSimulated?: boolean;
  meta: {
    title: string;
    description: string;
    keywords: string;
    viewport: string;
    robots: string;
    canonical: string;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  images: {
    total: number;
    missingAlt: number;
    list: Array<{ src: string; alt: string; hasAlt: boolean }>;
  };
  links: {
    total: number;
    internal: number;
    external: number;
    list: Array<{ href: string; type: 'internal' | 'external'; text: string }>;
  };
  structuredData: {
    hasJsonLd: boolean;
    types: string[];
  };
  /** `<html lang>`; empty when absent. Optional on every field below: scans stored before these checks existed lack them. */
  lang?: string;
  /** Open Graph and Twitter Card tags found in <head>. Empty string = tag absent. */
  social?: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: string;
    twitterCard: string;
  };
  /** `<link rel="alternate" hreflang>` annotations. */
  hreflang?: Array<{ lang: string; href: string }>;
  /** Visible words in the rendered body (scripts/styles stripped). Low counts flag thin content. */
  wordCount?: number;
  /** Lab-measured from the scanning host; not field data. Undefined when the browser did not report them. */
  webVitals?: { lcpMs?: number; cls?: number };
}

export type ProgressLevel = 'start' | 'info' | 'ok' | 'warn' | 'fail' | 'done';

/**
 * One line of the live audit log. `stage` is an id from AUDIT_CHECKS (or 'scan' for lifecycle
 * lines). `t` is milliseconds since the scan was queued. `done` closes a stage; its `msg` is a
 * short result summary.
 */
export interface ProgressEvent {
  i: number;
  t: number;
  stage: string;
  level: ProgressLevel;
  msg: string;
}

export interface SecurityHeaders {
  https: boolean;
  hsts: boolean;
  csp: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
}

export interface BrokenLink {
  href: string;
  /** HTTP status, or 0 when the request failed outright (timeout/DNS/refused). */
  status: number;
  type: 'internal' | 'external';
}

export interface DuplicateGroup {
  value: string;
  urls: string[];
}

export interface CrawlResult {
  rootUrl: string;
  mode: ScanMode;
  depth: number;
  timestamp: string;
  mainPage: CrawlPageData;
  additionalPages: CrawlPageData[];
  sitemapFound: boolean;
  sitemapUrl?: string;
  /**
   * Whether /llms.txt exists. The report used to assert "no llms.txt / no AI-crawler directives"
   * purely because nothing ever checked — a claim with no data behind it. Now it is fetched.
   */
  llmsTxtFound: boolean;
  hasSimulatedData: boolean;
  /** True when robots.txt disallows everything (`User-agent: *` + `Disallow: /`). */
  robotsBlocksAll?: boolean;
  /** Each URL visited from the requested one to the final page (length 1 = no redirect). */
  redirectChain?: string[];
  securityHeaders?: SecurityHeaders;
  /** Sample of links on the main page that returned an error status. `linksChecked` is the sample size. */
  brokenLinks?: BrokenLink[];
  linksChecked?: number;
  /** Titles/descriptions shared by more than one crawled page (FULL_SITE only). */
  duplicateTitles?: DuplicateGroup[];
  duplicateDescriptions?: DuplicateGroup[];
  /** The full audit log of this scan: every request, measurement and fallback, in order. */
  log?: ProgressEvent[];
}

export interface AgentReadyPrompt {
  /** Short imperative title for the hand-off task. */
  title: string;
  /** The complete, copy-pasteable prompt for a coding agent. */
  prompt: string;
  /** Ordered, individually verifiable tasks. */
  checklist: string[];
}

export interface DeepSeekSeoReport {
  score: {
    overall: number;
    technical: number;
    content: number;
    aeoGeo: number; // Answer/Generative Engine Optimization
    performance: number;
  };
  executiveSummary: string;
  criticalIssues: string[];
  recommendedFixes: Array<{
    title: string;
    category: 'technical' | 'content' | 'aeo-geo' | 'performance';
    priority: 'high' | 'medium' | 'low';
    description: string;
    remediation: string;
  }>;
  aeoAssessment: {
    generativeFriendlinessScore: number;
    directAnswerFriendliness: string;
    richSnippetEligibility: string[];
    voiceSearchOptimized: boolean;
    recommendationsForAeo: string[];
  };
  /** Hand-off prompt the user can paste straight into a coding agent. */
  agentReadyPrompt?: AgentReadyPrompt;
  competitorComparisonText?: string;
}

export interface WhiteLabelSettings {
  logoUrl?: string;
  agencyName?: string;
  primaryColor: string; // e.g. "#0ea5e9"
  accentColor: string;  // e.g. "#1e40af"
  customFooter: string;
  enabledSections: string[]; // e.g., ["executive", "technical", "content", "aeo-geo", "checklist"]
  language: 'en' | 'es';
  webhookUrl?: string;
  webhookSecret?: string;
  monitoringEmail?: string;
  enableEmailAlerts?: boolean;
}

export interface Scan {
  id: string;
  url: string;
  mode: ScanMode;
  depth: number;
  status: ScanStatus;
  leadEmail?: string;
  leadName?: string;
  crawlData?: CrawlResult;
  seoReport?: DeepSeekSeoReport;
  /** Set when a scheduled monitor started this scan. */
  monitorId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type MonitorFrequency = 'DAILY' | 'WEEKLY';

export interface Monitor {
  id: string;
  url: string;
  frequency: MonitorFrequency;
  active: boolean;
  /** Alert when the overall score falls by at least this many points. */
  alertDrop: number;
  lastRunAt?: string | null;
  nextRunAt: string;
  createdAt: string;
  latestScore?: number | null;
  latestScanId?: string | null;
}

export interface MonitorHistoryPoint {
  scanId: string;
  at: string;
  overall: number | null;
  technical: number | null;
  content: number | null;
  aeoGeo: number | null;
  performance: number | null;
  criticalIssuesCount: number;
  simulated: boolean;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface Lead {
  scanId: string;
  email: string;
  name?: string | null;
  url: string;
  status: ScanStatus;
  overallScore: number | null;
  criticalIssuesCount: number;
  capturedAt: string;
}
