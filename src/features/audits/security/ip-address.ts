import { isIP } from "node:net";

const blockedIpv4Ranges: ReadonlyArray<readonly [number, number]> = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0000200, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xc6336400, 24],
  [0xcb007100, 24],
  [0xe0000000, 4],
];

function ipv4ToInteger(address: string): number {
  return (
    address
      .split(".")
      .reduce((value, segment) => (value << 8) + Number(segment), 0) >>> 0
  );
}

function isIpv4IntegerBlocked(value: number): boolean {
  return blockedIpv4Ranges.some(([network, prefix]) => {
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) >>> 0 === (network & mask) >>> 0;
  });
}

function isIpv4Blocked(address: string): boolean {
  return isIpv4IntegerBlocked(ipv4ToInteger(address));
}

function parseIpv6(address: string): bigint {
  const [left = "", right = ""] = address.toLowerCase().split("::");
  const expandIpv4Group = (groups: string[]) => {
    const ipv4 = groups.at(-1);

    if (!ipv4?.includes(".")) return groups;

    const value = ipv4ToInteger(ipv4);
    return [
      ...groups.slice(0, -1),
      (value >>> 16).toString(16),
      (value & 0xffff).toString(16),
    ];
  };
  const leftGroups = expandIpv4Group(left ? left.split(":") : []);
  const rightGroups = expandIpv4Group(right ? right.split(":") : []);
  const groups = [...leftGroups, ...rightGroups];

  const zeroCount = 8 - groups.length;
  const expanded = address.includes("::")
    ? [...leftGroups, ...Array(zeroCount).fill("0"), ...rightGroups]
    : groups;

  return BigInt(
    `0x${expanded.map((group) => group.padStart(4, "0")).join("")}`,
  );
}

function isIpv6InRange(
  address: bigint,
  network: string,
  prefix: number,
): boolean {
  const networkAddress = parseIpv6(network);
  const mask = ((BigInt(1) << BigInt(128)) - BigInt(1)) << BigInt(128 - prefix);

  return (address & mask) === (networkAddress & mask);
}

function isIpv6Blocked(address: string): boolean {
  const value = parseIpv6(address);

  if (isIpv6InRange(value, "::ffff:0:0", 96)) {
    return isIpv4IntegerBlocked(Number(value & BigInt("0xffffffff")));
  }

  const blockedRanges: ReadonlyArray<readonly [string, number]> = [
    ["::", 128],
    ["::1", 128],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
    ["2001:db8::", 32],
  ];

  return blockedRanges.some(([network, prefix]) =>
    isIpv6InRange(value, network, prefix),
  );
}

export function isPublicIpAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) return !isIpv4Blocked(address);
  if (version === 6) return !isIpv6Blocked(address);

  return false;
}
