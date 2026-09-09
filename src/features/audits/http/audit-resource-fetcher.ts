import { fetchTimeoutMs, maxRedirects } from "./secure-website-fetcher";
import { validateAuditTarget } from "../security/validate-audit-target";

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);

type FetchLike = (input: URL | string, init?: RequestInit) => Promise<Response>;
type TargetValidator = typeof validateAuditTarget;

export type AuditResourceFetcherOptions = {
  fetcher?: FetchLike;
  maxRedirectCount?: number;
  timeoutMs?: number;
  validateTarget?: TargetValidator;
};

export async function isAuditResourceAvailable(
  input: URL,
  options: AuditResourceFetcherOptions = {},
): Promise<boolean> {
  const fetcher = options.fetcher ?? fetch;
  const maxRedirectCount = options.maxRedirectCount ?? maxRedirects;
  const timeoutMs = options.timeoutMs ?? fetchTimeoutMs;
  const validateTarget = options.validateTarget ?? validateAuditTarget;
  let target: Awaited<ReturnType<TargetValidator>>;

  try {
    target = await validateTarget(input.toString());
  } catch {
    return false;
  }

  for (
    let redirectCount = 0;
    redirectCount <= maxRedirectCount;
    redirectCount += 1
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetcher(target.url, {
        headers: { "user-agent": "SiteAuditDashboard/1.0" },
        redirect: "manual",
        signal: controller.signal,
      });

      if (!redirectStatusCodes.has(response.status)) {
        await response.body?.cancel();
        return response.ok;
      }

      const location = response.headers.get("location");
      if (!location || redirectCount === maxRedirectCount) return false;

      target = await validateTarget(new URL(location, target.url).toString());
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  return false;
}
