import { desc, eq } from "drizzle-orm";

import type { createDatabaseClient } from "../../../db/client";
import type { CoreAudit } from "../audit-runner";
import { audits, type AuditStatus } from "../../../db/schema";

type AuditDatabase = ReturnType<typeof createDatabaseClient>;

function hostnameFrom(input: string): string {
  try {
    return new URL(input).hostname;
  } catch {
    return "unknown";
  }
}

export function toAuditRecord(audit: CoreAudit): typeof audits.$inferInsert {
  const completed = audit.status === "completed";

  return {
    completedAt: completed ? new Date() : undefined,
    durationMs: audit.durationMs,
    errorCode: completed ? undefined : "audit_failed",
    errorMessage: completed ? undefined : audit.error,
    finalUrl: completed ? audit.finalUrl : undefined,
    hostname: hostnameFrom(audit.requestedUrl),
    requestedUrl: audit.requestedUrl,
    results: completed ? audit.checks : undefined,
    status: audit.status as AuditStatus,
    summary: completed ? { ...audit.summary, unavailable: 0 } : undefined,
  };
}

export function createAuditRepository(database: AuditDatabase) {
  return {
    async findById(id: string) {
      const records = await database
        .select()
        .from(audits)
        .where(eq(audits.id, id))
        .limit(1);
      return records[0] ?? null;
    },
    async listRecent(limit = 20) {
      return database
        .select()
        .from(audits)
        .orderBy(desc(audits.createdAt))
        .limit(limit);
    },
    async save(audit: CoreAudit) {
      const records = await database
        .insert(audits)
        .values(toAuditRecord(audit))
        .returning();
      return records[0];
    },
  };
}
