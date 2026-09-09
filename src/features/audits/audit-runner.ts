import { coreHtmlChecks } from "./checks/core-html-checks";
import { runHtmlChecks } from "./checks/run-html-checks";
import type { AuditCheckResult, HtmlAuditCheck } from "./checks/types";
import { parseHtmlDocument } from "./html/parse-document";
import {
  fetchWebsiteHtml,
  type WebsiteFetchResult,
} from "./http/secure-website-fetcher";

export type AuditSummary = {
  critical: number;
  passed: number;
  warnings: number;
};

export type CompletedAudit = {
  checks: AuditCheckResult[];
  durationMs: number;
  finalUrl: string;
  requestedUrl: string;
  status: "completed";
  summary: AuditSummary;
};

export type FailedAudit = {
  durationMs: number;
  error: string;
  requestedUrl: string;
  status: "failed";
};

export type CoreAudit = CompletedAudit | FailedAudit;

export type AuditRunnerDependencies = {
  checks: HtmlAuditCheck[];
  fetchWebsite: (input: unknown) => Promise<WebsiteFetchResult>;
  parseHtml: typeof parseHtmlDocument;
};

const defaultDependencies: AuditRunnerDependencies = {
  checks: coreHtmlChecks,
  fetchWebsite: fetchWebsiteHtml,
  parseHtml: parseHtmlDocument,
};

function createHttpChecks(result: WebsiteFetchResult): AuditCheckResult[] {
  return [
    result.finalUrl.protocol === "https:"
      ? {
          category: "http",
          id: "https",
          message: "The final page URL uses HTTPS.",
          name: "HTTPS",
          severity: "info",
          status: "passed",
        }
      : {
          category: "http",
          id: "https",
          message: "The final page URL does not use HTTPS.",
          name: "HTTPS",
          recommendation: "Serve this page over HTTPS.",
          severity: "warning",
          status: "warning",
        },
    result.statusCode >= 200 && result.statusCode < 400
      ? {
          category: "http",
          id: "http-status",
          message: `The page returned HTTP ${result.statusCode}.`,
          name: "HTTP status",
          severity: "info",
          status: "passed",
          value: String(result.statusCode),
        }
      : {
          category: "http",
          id: "http-status",
          message: `The page returned HTTP ${result.statusCode}.`,
          name: "HTTP status",
          recommendation:
            "Resolve the HTTP error before improving page metadata.",
          severity: "critical",
          status: "failed",
          value: String(result.statusCode),
        },
  ];
}

function summarize(checks: AuditCheckResult[]): AuditSummary {
  return checks.reduce(
    (summary, check) => ({
      critical: summary.critical + (check.severity === "critical" ? 1 : 0),
      passed: summary.passed + (check.status === "passed" ? 1 : 0),
      warnings: summary.warnings + (check.status === "warning" ? 1 : 0),
    }),
    { critical: 0, passed: 0, warnings: 0 },
  );
}

export async function runCoreAudit(
  input: string,
  dependencies: AuditRunnerDependencies = defaultDependencies,
): Promise<CoreAudit> {
  const startedAt = performance.now();

  try {
    const fetched = await dependencies.fetchWebsite(input);
    const checks = [
      ...createHttpChecks(fetched),
      ...runHtmlChecks(
        dependencies.parseHtml(fetched.html),
        dependencies.checks,
      ),
    ];

    return {
      checks,
      durationMs: Math.round(performance.now() - startedAt),
      finalUrl: fetched.finalUrl.toString(),
      requestedUrl: input,
      status: "completed",
      summary: summarize(checks),
    };
  } catch {
    return {
      durationMs: Math.round(performance.now() - startedAt),
      error: "The website audit could not be completed.",
      requestedUrl: input,
      status: "failed",
    };
  }
}
