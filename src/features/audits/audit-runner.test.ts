import { describe, expect, it } from "vitest";
import { runCoreAudit, type AuditRunnerDependencies } from "./audit-runner";

const dependencies: AuditRunnerDependencies = {
  checks: [],
  fetchResource: async () => true,
  fetchWebsite: async () => ({
    finalUrl: new URL("https://example.com"),
    html: "<title>Example</title>",
    responseTimeMs: 12,
    statusCode: 200,
  }),
  getPageSpeed: async () => ({
    available: true,
    scores: {
      accessibility: 96,
      bestPractices: 100,
      performance: 87,
      seo: 92,
      strategy: "mobile",
    },
  }),
  parseHtml: () => undefined as never,
};

describe("runCoreAudit", () => {
  it("aggregates HTTP checks and configured checks", async () => {
    const audit = await runCoreAudit("https://example.com", dependencies);
    expect(audit).toMatchObject({
      status: "completed",
      summary: { critical: 0, passed: 4, warnings: 0 },
    });
  });

  it("returns a controlled failed audit", async () => {
    const audit = await runCoreAudit("https://example.com", {
      ...dependencies,
      fetchWebsite: async () => Promise.reject(new Error("timeout")),
    });
    expect(audit).toMatchObject({
      status: "failed",
      error: "The website audit could not be completed.",
    });
  });

  it("marks an otherwise successful audit as partial when PageSpeed is unavailable", async () => {
    const audit = await runCoreAudit("https://example.com", {
      ...dependencies,
      getPageSpeed: async () => ({ available: false, reason: "timeout" }),
    });
    expect(audit).toMatchObject({ status: "partial" });
  });

  it("returns warnings when discovery resources are unavailable", async () => {
    const audit = await runCoreAudit("https://example.com", {
      ...dependencies,
      fetchResource: async () => false,
    });

    expect(audit).toMatchObject({
      status: "completed",
      summary: { critical: 0, passed: 2, warnings: 2 },
    });
  });
});
