import Link from "next/link";
import { notFound } from "next/navigation";

import { getDatabaseClient } from "@/db/client";
import { createAuditRepository } from "@/features/audits/repositories/audit-repository";
import type { AuditCheckResult } from "@/features/audits/checks/types";

export const dynamic = "force-dynamic";

function isAuditCheckResult(value: unknown): value is AuditCheckResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "message" in value &&
    "status" in value
  );
}

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const audit =
    await createAuditRepository(getDatabaseClient()).findById(auditId);
  if (!audit) notFound();

  const summary = audit.summary;
  const checks = Array.isArray(audit.results)
    ? audit.results.filter(isAuditCheckResult)
    : [];
  const scores = audit.scores;
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link className="text-sm font-medium text-blue-700" href="/">
        ← New audit
      </Link>
      <p className="mt-8 text-sm text-slate-500">{audit.status}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-950">
        {audit.hostname}
      </h1>
      <p className="mt-2 text-slate-600">{audit.requestedUrl}</p>
      {summary ? (
        <>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <p className="rounded-xl border p-4">{summary.critical} critical</p>
            <p className="rounded-xl border p-4">{summary.warnings} warnings</p>
            <p className="rounded-xl border p-4">{summary.passed} passed</p>
          </div>
          {scores ? (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">PageSpeed Insights</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Performance", scores.performance],
                  ["Accessibility", scores.accessibility],
                  ["SEO", scores.seo],
                  ["Best practices", scores.bestPractices],
                ].map(([label, score]) => (
                  <div
                    className="rounded-xl border bg-white p-4"
                    key={String(label)}
                  >
                    <p className="text-xs text-slate-600">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{score}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              PageSpeed Insights was unavailable; HTML checks are still
              complete.
            </p>
          )}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Checks</h2>
            <div className="mt-3 space-y-3">
              {checks.map((check) => (
                <article
                  className="rounded-xl border bg-white p-4"
                  key={check.id}
                >
                  <div className="flex justify-between gap-4">
                    <h3 className="font-medium">{check.name}</h3>
                    <span className="text-sm text-slate-600">
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{check.message}</p>
                  {check.recommendation ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Recommendation: {check.recommendation}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {audit.errorMessage ?? "This audit could not be completed."}
        </p>
      )}
    </main>
  );
}
