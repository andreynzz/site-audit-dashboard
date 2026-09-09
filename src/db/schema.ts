import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const auditStatuses = [
  "pending",
  "running",
  "completed",
  "partial",
  "failed",
] as const;

export type AuditStatus = (typeof auditStatuses)[number];

export type AuditSummary = {
  critical: number;
  passed: number;
  unavailable: number;
  warnings: number;
};

export type AuditScores = {
  accessibility?: number;
  bestPractices?: number;
  performance?: number;
  seo?: number;
  strategy: "mobile";
};

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestedUrl: text("requested_url").notNull(),
    finalUrl: text("final_url"),
    hostname: varchar("hostname", { length: 255 }).notNull(),
    status: varchar("status", { enum: auditStatuses, length: 16 })
      .notNull()
      .default("pending"),
    durationMs: integer("duration_ms"),
    errorCode: varchar("error_code", { length: 64 }),
    errorMessage: text("error_message"),
    summary: jsonb("summary").$type<AuditSummary>(),
    scores: jsonb("scores").$type<AuditScores>(),
    results: jsonb("results").$type<unknown[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("audits_created_at_idx").on(table.createdAt),
    index("audits_hostname_created_at_idx").on(table.hostname, table.createdAt),
  ],
);
