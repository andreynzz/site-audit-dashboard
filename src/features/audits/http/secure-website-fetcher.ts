import {
  type ValidatedAuditTarget,
  validateAuditTarget,
} from "../security/validate-audit-target";

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

export const maxRedirects = 3;
export const maxHtmlBytes = 2 * 1024 * 1024;
export const fetchTimeoutMs = 10_000;

export type WebsiteFetchErrorCode =
  | "invalid_content_type"
  | "invalid_response"
  | "network_error"
  | "response_too_large"
  | "timeout"
  | "too_many_redirects";

export class WebsiteFetchError extends Error {
  constructor(
    public readonly code: WebsiteFetchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WebsiteFetchError";
  }
}

export type WebsiteFetchResult = {
  finalUrl: URL;
  html: string;
  responseTimeMs: number;
  statusCode: number;
};

type FetchLike = (input: URL | string, init?: RequestInit) => Promise<Response>;
type TargetValidator = (input: unknown) => Promise<ValidatedAuditTarget>;

export type SecureWebsiteFetcherOptions = {
  fetcher?: FetchLike;
  maxBytes?: number;
  maxRedirectCount?: number;
  timeoutMs?: number;
  validateTarget?: TargetValidator;
};

function isHtmlContentType(contentType: string | null): boolean {
  return (
    contentType?.toLowerCase().split(";", 1)[0] === "text/html" ||
    contentType?.toLowerCase().split(";", 1)[0] === "application/xhtml+xml"
  );
}

async function readBody(response: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new WebsiteFetchError(
      "response_too_large",
      "The website HTML response exceeds the allowed size.",
    );
  }

  if (!response.body) {
    throw new WebsiteFetchError(
      "invalid_response",
      "The website returned an empty response body.",
    );
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel();
      throw new WebsiteFetchError(
        "response_too_large",
        "The website HTML response exceeds the allowed size.",
      );
    }
    chunks.push(value);
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

function asFetchError(error: unknown, didTimeout: boolean): WebsiteFetchError {
  if (didTimeout || (error instanceof Error && error.name === "AbortError")) {
    return new WebsiteFetchError(
      "timeout",
      "The website did not respond before the timeout.",
    );
  }
  if (error instanceof WebsiteFetchError) return error;

  return new WebsiteFetchError(
    "network_error",
    "The website could not be reached.",
  );
}

export async function fetchWebsiteHtml(
  input: unknown,
  options: SecureWebsiteFetcherOptions = {},
): Promise<WebsiteFetchResult> {
  const fetcher = options.fetcher ?? fetch;
  const validateTarget = options.validateTarget ?? validateAuditTarget;
  const maxBytes = options.maxBytes ?? maxHtmlBytes;
  const maxRedirectCount = options.maxRedirectCount ?? maxRedirects;
  const timeoutMs = options.timeoutMs ?? fetchTimeoutMs;
  let target = await validateTarget(input);
  const startedAt = performance.now();

  for (
    let redirectCount = 0;
    redirectCount <= maxRedirectCount;
    redirectCount += 1
  ) {
    const controller = new AbortController();
    let didTimeout = false;
    const timeout = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetcher(target.url, {
        headers: { "user-agent": "SiteAuditDashboard/1.0" },
        redirect: "manual",
        signal: controller.signal,
      });

      if (redirectStatusCodes.has(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new WebsiteFetchError(
            "invalid_response",
            "The website returned a redirect without a destination.",
          );
        }
        if (redirectCount === maxRedirectCount) {
          throw new WebsiteFetchError(
            "too_many_redirects",
            "The website redirected too many times.",
          );
        }

        target = await validateTarget(new URL(location, target.url).toString());
        continue;
      }

      if (!isHtmlContentType(response.headers.get("content-type"))) {
        throw new WebsiteFetchError(
          "invalid_content_type",
          "The website did not return an HTML document.",
        );
      }

      return {
        finalUrl: target.url,
        html: await readBody(response, maxBytes),
        responseTimeMs: Math.round(performance.now() - startedAt),
        statusCode: response.status,
      };
    } catch (error) {
      throw asFetchError(error, didTimeout);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new WebsiteFetchError(
    "too_many_redirects",
    "The website redirected too many times.",
  );
}
