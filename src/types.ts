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
  /** Measured evidence the report is checked against (see lib/audit). Absent on scans stored before it existed. */
  facts?: AuditFacts;
}

// ---- Measured evidence ---------------------------------------------------------------------------
// Everything below is observed directly (an HTTP request, a parse of the HTML), never written by a
// model. The report's scores and its fix list are checked against it.

export type BotRole = 'training' | 'search' | 'assistant';

export interface BotAccessResult {
  name: string;
  role: BotRole;
  /** HTTP status the site returned to this crawler's published user agent; 0 = the request failed. */
  status: number;
  /** 401/403/406/429 or a failed request while a normal browser got through. */
  blocked: boolean;
  /** What robots.txt says for this crawler on "/"; null when robots.txt could not be read. */
  robotsAllows: boolean | null;
}

export interface BotAccess {
  checkedUrl: string;
  /** Status a plain browser-style request got, the baseline each crawler is compared against. */
  baselineStatus: number;
  results: BotAccessResult[];
  /** Crawlers robots.txt welcomes but the site refuses at the network layer (e.g. a CDN bot rule). */
  conflicts: string[];
}

export interface RawVsRendered {
  /** Plain HTTP fetch, no JavaScript: what a crawler that does not run scripts receives. */
  rawStatus: number;
  rawBytes: number;
  rawWords: number;
  rawLinks: number;
  rawSchemaTypes: string[];
  /** After a real browser ran the page's JavaScript. */
  renderedWords: number;
  renderedLinks: number;
  renderedSchemaTypes: string[];
  /** Schema types that exist only after JavaScript runs. */
  schemaOnlyAfterJs: string[];
  /** <button>s inside header/nav/footer: navigation a crawler cannot follow. */
  navButtons: number;
  navAnchors: number;
}

export interface SchemaEntity {
  type: string;
  /** Property names present on this entity. */
  props: string[];
  prices: Array<{ price: string; currency: string }>;
  version?: string;
  totalTime?: string;
  stepNames: string[];
  questions: string[];
  hasRating: boolean;
  hasReview: boolean;
}

export interface SchemaFacts {
  entities: SchemaEntity[];
  /** Schema items (HowTo steps, FAQ questions) whose text is not on the visible page. */
  invisible: Array<{ type: string; items: string[]; total: number }>;
}

export interface ContentSignals {
  /** Section presence read from the rendered page's headings, navigation and text. */
  sections: { pricing: boolean; faq: boolean; howItWorks: boolean; features: boolean; about: boolean; contact: boolean; reviews: boolean };
  /** Dollar amounts visible on the page; the only prices a recommendation may mention. */
  prices: string[];
  hasVisibleReviews: boolean;
  multiLanguage: boolean;
}

export interface AuditFacts {
  botAccess?: BotAccess;
  rawVsRendered?: RawVsRendered;
  schema?: SchemaFacts;
  signals?: ContentSignals;
}

export interface ScoreDeduction {
  points: number;
  reason: string;
}

export interface ScoreBreakdown {
  technical: ScoreDeduction[];
  content: ScoreDeduction[];
  aeoGeo: ScoreDeduction[];
  performance: ScoreDeduction[];
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
  /**
   * 'measured' = scores are computed by fixed rules from the crawl (lib/audit/scoring.ts), with the
   * deductions listed in scoreBreakdown. 'illustrative' = placeholder data was used.
   * Older reports have neither and carry model-written estimates.
   */
  scoreMethod?: 'measured' | 'illustrative';
  scoreBreakdown?: ScoreBreakdown;
  /** What the evidence check did to the written report. */
  qa?: { removed: Array<{ title: string; reason: string }>; added: string[] };
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
  /** Set by the server when the account's plan does not include white-label branding. */
  brandingLocked?: boolean;
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
