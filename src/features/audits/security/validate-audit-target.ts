import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { ZodError } from "zod";

import { auditTargetSchema } from "../schemas/audit-target.schema";
import { isPublicIpAddress } from "./ip-address";

const allowedPorts = new Set(["", "80", "443"]);
const blockedHostnames = new Set(["localhost", "metadata.google.internal"]);

export type AuditTargetErrorCode =
  | "invalid_url"
  | "invalid_protocol"
  | "invalid_port"
  | "unsafe_hostname"
  | "unsafe_network"
  | "unresolvable_hostname";

export class AuditTargetValidationError extends Error {
  constructor(
    public readonly code: AuditTargetErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuditTargetValidationError";
  }
}

export type ResolvedAddress = { address: string; family: 4 | 6 };
export type HostResolver = (hostname: string) => Promise<ResolvedAddress[]>;

export type ValidatedAuditTarget = {
  hostname: string;
  resolvedAddresses: ResolvedAddress[];
  url: URL;
};

const defaultResolver: HostResolver = async (hostname) =>
  lookup(hostname, { all: true, verbatim: true }).then((addresses) =>
    addresses.map(({ address, family }) => ({
      address,
      family: family as 4 | 6,
    })),
  );

function parseUrl(input: unknown): URL {
  try {
    return new URL(auditTargetSchema.parse(input));
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message
        : "Enter a valid website URL.";
    throw new AuditTargetValidationError("invalid_url", message);
  }
}

function validateUrlShape(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AuditTargetValidationError(
      "invalid_protocol",
      "Only HTTP and HTTPS website URLs are allowed.",
    );
  }

  if (url.username || url.password) {
    throw new AuditTargetValidationError(
      "invalid_url",
      "Website URLs cannot include credentials.",
    );
  }

  if (!allowedPorts.has(url.port)) {
    throw new AuditTargetValidationError(
      "invalid_port",
      "Only ports 80 and 443 are allowed.",
    );
  }
}

function isBlockedHostname(hostname: string): boolean {
  return (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  );
}

export async function validateAuditTarget(
  input: unknown,
  resolver: HostResolver = defaultResolver,
): Promise<ValidatedAuditTarget> {
  const url = parseUrl(input);
  validateUrlShape(url);

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");

  if (isBlockedHostname(hostname)) {
    throw new AuditTargetValidationError(
      "unsafe_hostname",
      "Local and internal hosts cannot be audited.",
    );
  }

  const resolvedAddresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) as 4 | 6 }]
    : await resolver(hostname).catch(() => {
        throw new AuditTargetValidationError(
          "unresolvable_hostname",
          "The website hostname could not be resolved.",
        );
      });

  if (resolvedAddresses.length === 0) {
    throw new AuditTargetValidationError(
      "unresolvable_hostname",
      "The website hostname could not be resolved.",
    );
  }

  if (resolvedAddresses.some(({ address }) => !isPublicIpAddress(address))) {
    throw new AuditTargetValidationError(
      "unsafe_network",
      "Private and reserved network targets cannot be audited.",
    );
  }

  return { hostname, resolvedAddresses, url };
}
