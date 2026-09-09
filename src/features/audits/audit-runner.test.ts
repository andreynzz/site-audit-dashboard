import { describe, expect, it } from "vitest";
import { runCoreAudit, type AuditRunnerDependencies } from "./audit-runner";

const dependencies: AuditRunnerDependencies = {
  checks: [],
  fetchWebsite: async () => ({
    finalUrl: new URL("https://example.com"),
    html: "<title>Example</title>",
    responseTimeMs: 12,
    statusCode: 200,
  }),
  parseHtml: () => undefined as never,
};

describe("runCoreAudit", () => {
  it("aggregates HTTP checks and configured checks", async () => {
    const audit = await runCoreAudit("https://example.com", dependencies);
    expect(audit).toMatchObject({
      status: "completed",
      summary: { critical: 0, passed: 2, warnings: 0 },
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
});
