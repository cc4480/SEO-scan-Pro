export type ScanMode = 'SINGLE' | 'FULL_SITE';
export type ScanStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CrawlPageData {
  url: string;
  loadTimeMs: number;
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
  hasSimulatedData: boolean;
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
