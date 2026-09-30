export type Status = "pass" | "warn" | "fail" | "info";

export interface Check {
  id: string;
  label: string;
  detail: string;
  why: string;
  fix: string;
  impact: 1 | 2 | 3;
  status: Status;
  standard: string;
}

export interface Category {
  id: string;
  label: string;
  checks: Check[];
}

export interface PageData {
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  html: string;
  htmlTruncated: boolean;
  robotsTxt: string | null;
  sitemapFound: boolean;
  llmsTxtFound: boolean;
}

export interface Summary {
  total: number;
  passed: number;
  gaps: Check[];
}
