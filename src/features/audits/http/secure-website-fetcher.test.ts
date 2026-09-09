import { describe, expect, it } from "vitest";

import type { ValidatedAuditTarget } from "../security/validate-audit-target";
import { WebsiteFetchError, fetchWebsiteHtml } from "./secure-website-fetcher";

const target = (url: string): ValidatedAuditTarget => ({
  hostname: new URL(url).hostname,
  resolvedAddresses: [{ address: "93.184.216.34", family: 4 }],
  url: new URL(url),
});

describe("fetchWebsiteHtml", () => {
  it("returns a bounded HTML response with HTTP metadata", async () => {
    const result = await fetchWebsiteHtml("https://example.com", {
      fetcher: async () =>
        new Response("<title>Example</title>", {
          headers: { "content-type": "text/html; charset=utf-8" },
          status: 200,
        }),
      validateTarget: async (url) => target(String(url)),
    });

    expect(result).toMatchObject({
      html: "<title>Example</title>",
      statusCode: 200,
    });
  });

  it("validates each redirect target", async () => {
    const validated: string[] = [];
    const result = await fetchWebsiteHtml("https://example.com", {
      fetcher: async (url) =>
        String(url) === "https://example.com/"
          ? new Response(null, {
              headers: { location: "https://www.example.com" },
              status: 302,
            })
          : new Response("ok", {
              headers: { "content-type": "text/html" },
              status: 200,
            }),
      validateTarget: async (url) => {
        validated.push(String(url));
        return target(String(url));
      },
    });

    expect(validated).toEqual([
      "https://example.com",
      "https://www.example.com/",
    ]);
    expect(result.finalUrl.toString()).toBe("https://www.example.com/");
  });

  it("does not follow more redirects than allowed", async () => {
    await expect(
      fetchWebsiteHtml("https://example.com", {
        fetcher: async () =>
          new Response(null, {
            headers: { location: "https://example.com/again" },
            status: 302,
          }),
        maxRedirectCount: 1,
        validateTarget: async (url) => target(String(url)),
      }),
    ).rejects.toMatchObject({
      code: "too_many_redirects",
    } satisfies Partial<WebsiteFetchError>);
  });

  it("rejects non-HTML and oversized responses", async () => {
    await expect(
      fetchWebsiteHtml("https://example.com", {
        fetcher: async () =>
          new Response("{}", {
            headers: { "content-type": "application/json" },
          }),
        validateTarget: async (url) => target(String(url)),
      }),
    ).rejects.toMatchObject({ code: "invalid_content_type" });

    await expect(
      fetchWebsiteHtml("https://example.com", {
        fetcher: async () =>
          new Response("too large", {
            headers: { "content-length": "100", "content-type": "text/html" },
          }),
        maxBytes: 10,
        validateTarget: async (url) => target(String(url)),
      }),
    ).rejects.toMatchObject({ code: "response_too_large" });
  });

  it("maps aborted requests to a controlled timeout", async () => {
    await expect(
      fetchWebsiteHtml("https://example.com", {
        fetcher: async () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          throw error;
        },
        validateTarget: async (url) => target(String(url)),
      }),
    ).rejects.toMatchObject({ code: "timeout" });
  });
});
