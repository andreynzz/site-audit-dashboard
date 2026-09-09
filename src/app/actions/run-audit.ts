"use server";

import { redirect } from "next/navigation";

import { getDatabaseClient } from "@/db/client";
import { runCoreAudit } from "@/features/audits/audit-runner";
import { createAuditRepository } from "@/features/audits/repositories/audit-repository";

export type RunAuditState = { message: string };

export async function runAuditAction(
  _previous: RunAuditState,
  formData: FormData,
): Promise<RunAuditState> {
  const url = formData.get("url");
  if (typeof url !== "string") return { message: "Enter a website URL." };

  const audit = await runCoreAudit(url);

  let saved;
  try {
    saved = await createAuditRepository(getDatabaseClient()).save(audit);
  } catch {
    return { message: "We could not save this audit. Please try again." };
  }

  if (!saved)
    return { message: "We could not save this audit. Please try again." };
  redirect(`/audits/${saved.id}`);
}
