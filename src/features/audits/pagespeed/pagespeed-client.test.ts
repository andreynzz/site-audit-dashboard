import { describe, expect, it } from "vitest";
import { getPageSpeedScores } from "./pagespeed-client";

describe("getPageSpeedScores", () => {
  it("normalizes Lighthouse category scores", async () => {
    const result = await getPageSpeedScores("https://example.com", {
      apiKey: "test",
      fetcher: async () =>
        new Response(
          JSON.stringify({
            lighthouseResult: {
              categories: {
                performance: { score: 0.87 },
                accessibility: { score: 0.96 },
                seo: { score: 0.92 },
                "best-practices": { score: 1 },
              },
            },
          }),
        ),
    });
    expect(result).toEqual({
      available: true,
      scores: {
        accessibility: 96,
        bestPractices: 100,
        performance: 87,
        seo: 92,
        strategy: "mobile",
      },
    });
  });
  it("does not call the provider without a key", async () =>
    expect(
      await getPageSpeedScores("https://example.com", { apiKey: "" }),
    ).toEqual({ available: false, reason: "missing_api_key" }));
});
