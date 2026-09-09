import Link from "next/link";
import { notFound } from "next/navigation";

import { getDatabaseClient } from "@/db/client";
import { createAuditRepository } from "@/features/audits/repositories/audit-repository";

export const dynamic = "force-dynamic";

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
        <div className="mt-8 grid grid-cols-3 gap-3">
          <p className="rounded-xl border p-4">{summary.critical} critical</p>
          <p className="rounded-xl border p-4">{summary.warnings} warnings</p>
          <p className="rounded-xl border p-4">{summary.passed} passed</p>
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {audit.errorMessage ?? "This audit could not be completed."}
        </p>
      )}
    </main>
  );
}
