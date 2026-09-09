import { describe, expect, it } from "vitest";

import { audits, auditStatuses } from "./schema";

describe("audit schema", () => {
  it("defines the complete audit lifecycle", () => {
    expect(auditStatuses).toEqual([
      "pending",
      "running",
      "completed",
      "partial",
      "failed",
    ]);
  });

  it("includes persisted audit result fields", () => {
    expect(Object.keys(audits)).toEqual(
      expect.arrayContaining([
        "id",
        "requestedUrl",
        "finalUrl",
        "hostname",
        "status",
        "summary",
        "scores",
        "results",
      ]),
    );
  });
});
