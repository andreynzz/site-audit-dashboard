import { describe, expect, it } from "vitest";

import {
  AuditTargetValidationError,
  type HostResolver,
  validateAuditTarget,
} from "./validate-audit-target";

const resolver =
  (addresses: string[]): HostResolver =>
  async () =>
    addresses.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    }));

async function expectBlocked(
  input: string,
  code: AuditTargetValidationError["code"],
) {
  await expect(
    validateAuditTarget(input, resolver(["93.184.216.34"])),
  ).rejects.toMatchObject({ code });
}

describe("validateAuditTarget", () => {
  it("accepts a public HTTPS hostname", async () => {
    await expect(
      validateAuditTarget(
        " https://example.com/path ",
        resolver(["93.184.216.34"]),
      ),
    ).resolves.toMatchObject({
      hostname: "example.com",
      resolvedAddresses: [{ address: "93.184.216.34", family: 4 }],
    });
  });

  it("rejects unsupported protocols, credentials, and custom ports", async () => {
    await expectBlocked("ftp://example.com", "invalid_protocol");
    await expectBlocked("https://user:secret@example.com", "invalid_url");
    await expectBlocked("https://example.com:8080", "invalid_port");
  });

  it("rejects localhost and cloud metadata hosts", async () => {
    await expectBlocked("http://localhost", "unsafe_hostname");
    await expectBlocked("http://metadata.google.internal", "unsafe_hostname");
  });

  it("rejects private IPv4 and IPv6 literal targets", async () => {
    await expectBlocked("http://127.0.0.1", "unsafe_network");
    await expectBlocked("http://169.254.169.254", "unsafe_network");
    await expectBlocked("http://[::1]", "unsafe_network");
    await expectBlocked("http://[fc00::1]", "unsafe_network");
    await expectBlocked("http://[::ffff:127.0.0.1]", "unsafe_network");
  });

  it("rejects hostnames that resolve to any private address", async () => {
    await expect(
      validateAuditTarget(
        "https://example.com",
        resolver(["93.184.216.34", "10.0.0.1"]),
      ),
    ).rejects.toMatchObject({
      code: "unsafe_network",
    });
  });

  it("returns a controlled error for an unresolvable hostname", async () => {
    const failingResolver: HostResolver = async () =>
      Promise.reject(new Error("DNS failure"));

    await expect(
      validateAuditTarget("https://example.com", failingResolver),
    ).rejects.toMatchObject({
      code: "unresolvable_hostname",
    });
  });
});
