export type PageSpeedScores = {
  accessibility: number;
  bestPractices: number;
  performance: number;
  seo: number;
  strategy: "mobile";
};

export type PageSpeedResult =
  | { available: true; scores: PageSpeedScores }
  | {
      available: false;
      reason: "missing_api_key" | "provider_error" | "timeout";
    };

type FetchLike = (input: URL | string, init?: RequestInit) => Promise<Response>;

export async function getPageSpeedScores(
  targetUrl: string,
  options: { apiKey?: string; fetcher?: FetchLike; timeoutMs?: number } = {},
): Promise<PageSpeedResult> {
  const apiKey = options.apiKey ?? process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return { available: false, reason: "missing_api_key" };

  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
  );
  endpoint.searchParams.set("url", targetUrl);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("strategy", "mobile");
  for (const category of [
    "performance",
    "accessibility",
    "seo",
    "best-practices",
  ])
    endpoint.searchParams.append("category", category);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  );
  try {
    const response = await (options.fetcher ?? fetch)(endpoint, {
      signal: controller.signal,
    });
    if (!response.ok) return { available: false, reason: "provider_error" };
    const categories = (await response.json()).lighthouseResult?.categories;
    const score = (id: string) =>
      Math.round((categories?.[id]?.score ?? 0) * 100);
    if (
      !["performance", "accessibility", "seo", "best-practices"].every(
        (id) => typeof categories?.[id]?.score === "number",
      )
    )
      return { available: false, reason: "provider_error" };
    return {
      available: true,
      scores: {
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        performance: score("performance"),
        seo: score("seo"),
        strategy: "mobile",
      },
    };
  } catch (error) {
    return {
      available: false,
      reason:
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : "provider_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
