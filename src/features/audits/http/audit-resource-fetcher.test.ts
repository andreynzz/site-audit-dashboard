import { describe, expect, it } from "vitest";
import type { ValidatedAuditTarget } from "../security/validate-audit-target";
import { isAuditResourceAvailable } from "./audit-resource-fetcher";

const target = (url: string): ValidatedAuditTarget => ({
  hostname: new URL(url).hostname,
  resolvedAddresses: [{ address: "93.184.216.34", family: 4 }],
  url: new URL(url),
});

describe("isAuditResourceAvailable", () => {
  it("returns true for an available resource", async () => {
    await expect(
      isAuditResourceAvailable(new URL("https://example.com/robots.txt"), {
        fetcher: async () => new Response("User-agent: *", { status: 200 }),
        validateTarget: async (url) => target(String(url)),
      }),
    ).resolves.toBe(true);
  });

  it("returns false when the resource is unavailable", async () => {
    await expect(
      isAuditResourceAvailable(new URL("https://example.com/sitemap.xml"), {
        fetcher: async () => new Response(null, { status: 404 }),
        validateTarget: async (url) => target(String(url)),
      }),
    ).resolves.toBe(false);
  });

  it("validates redirect destinations", async () => {
    const validated: string[] = [];

    await expect(
      isAuditResourceAvailable(new URL("https://example.com/robots.txt"), {
        fetcher: async (url) =>
          String(url) === "https://example.com/robots.txt"
            ? new Response(null, {
                headers: { location: "https://www.example.com/robots.txt" },
                status: 302,
              })
            : new Response("User-agent: *", { status: 200 }),
        validateTarget: async (url) => {
          validated.push(String(url));
          return target(String(url));
        },
      }),
    ).resolves.toBe(true);

    expect(validated).toEqual([
      "https://example.com/robots.txt",
      "https://www.example.com/robots.txt",
    ]);
  });
});
