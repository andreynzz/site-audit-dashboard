import Link from "next/link";

import { getDatabaseClient } from "@/db/client";
import { createAuditRepository } from "@/features/audits/repositories/audit-repository";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AuditHistoryPage() {
  const audits = await createAuditRepository(getDatabaseClient()).listRecent();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link className="text-sm font-medium text-blue-700" href="/">
        ← New audit
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">
        Audit history
      </h1>
      <p className="mt-2 text-slate-600">Recently saved technical audits.</p>
      {audits.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
          No audits yet. Run your first public website audit to see it here.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {audits.map((audit) => (
            <Link
              className="block border-b border-slate-100 p-5 transition-colors last:border-0 hover:bg-slate-50"
              href={`/audits/${audit.id}`}
              key={audit.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {audit.hostname}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {audit.requestedUrl}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {audit.status}
                </span>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-slate-600">
                <span>{formatDate(audit.createdAt)}</span>
                {audit.summary ? (
                  <span>
                    {audit.summary.critical} critical · {audit.summary.warnings}{" "}
                    warnings · {audit.summary.passed} passed
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
