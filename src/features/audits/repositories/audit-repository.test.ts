import { describe, expect, it } from "vitest";

import { toAuditRecord } from "./audit-repository";

describe("toAuditRecord", () => {
  it("maps completed results into a persistable audit", () => {
    const record = toAuditRecord({
      checks: [],
      durationMs: 45,
      finalUrl: "https://example.com/",
      requestedUrl: "https://example.com",
      status: "completed",
      summary: { critical: 0, passed: 2, warnings: 0 },
    });
    expect(record).toMatchObject({
      hostname: "example.com",
      status: "completed",
      summary: { unavailable: 0 },
    });
  });

  it("maps failures without exposing an internal error code", () => {
    const record = toAuditRecord({
      durationMs: 45,
      error: "The website audit could not be completed.",
      requestedUrl: "https://example.com",
      status: "failed",
    });
    expect(record).toMatchObject({
      errorCode: "audit_failed",
      hostname: "example.com",
      status: "failed",
    });
  });
});
