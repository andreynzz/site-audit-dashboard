import { z } from "zod";

export const maxAuditTargetLength = 2_048;

export const auditTargetSchema = z
  .string()
  .trim()
  .min(1, "Enter a website URL.")
  .max(maxAuditTargetLength, "The website URL is too long.");
