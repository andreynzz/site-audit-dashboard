import type { CheerioAPI } from "cheerio";
import type { AuditCheckResult, HtmlAuditCheck } from "./types";

export function runHtmlChecks(
  document: CheerioAPI,
  checks: HtmlAuditCheck[],
): AuditCheckResult[] {
  return checks.map((check) => check.run(document));
}
