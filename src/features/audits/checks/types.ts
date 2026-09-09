import type { CheerioAPI } from "cheerio";

export type AuditCheckResult = {
  category: "seo";
  id: string;
  message: string;
  name: string;
  recommendation?: string;
  severity: "info" | "warning" | "critical";
  status: "passed" | "warning" | "failed";
  value?: string;
};

export type HtmlAuditCheck = {
  id: string;
  run: (document: CheerioAPI) => AuditCheckResult;
};
