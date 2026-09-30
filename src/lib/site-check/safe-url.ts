/*
  Decides which addresses the website check may ever contact. The tool fetches
  URLs typed by strangers, so the rule is strict: public domain names on the
  standard web ports, nothing else. Server-side request forgery (reaching
  internal services such as cloud metadata at 169.254.169.254) is the main
  risk this file exists to remove.
*/

export type ParsedTarget = { ok: true; url: URL } | { ok: false; reason: string };

const MAX_INPUT = 2048;
const ALLOWED_PORTS = new Set(["", "80", "443"]);
const BLOCKED_SUFFIXES = ["localhost", "local", "internal", "lan", "home", "home.arpa", "arpa", "test", "invalid", "example", "corp", "intranet", "private", "onion"];

const refuse = (reason: string): ParsedTarget => ({ ok: false, reason });

export function parseTargetUrl(input: string): ParsedTarget {
  const raw = String(input ?? "").trim();
  if (!raw) return refuse("empty");
  if (raw.length > MAX_INPUT) return refuse("too-long");
  if (raw.startsWith("//")) return refuse("scheme");

  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    const looksLikeHostPort = /^[^/\s:]+:\d+(\/|$)/.test(raw);
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !looksLikeHostPort) return refuse("scheme");
    candidate = `https://${raw}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return refuse("invalid");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return refuse("scheme");
  if (url.username || url.password) return refuse("credentials");
  if (!ALLOWED_PORTS.has(url.port)) return refuse("port");

  const host = url.hostname.toLowerCase().replace(/\.+$/, "");
  if (!host || host.startsWith("[") || /^[\d.]+$/.test(host) || /\.\d+$/.test(host)) return refuse("ip-literal");
  if (!host.includes(".")) return refuse("not-public");
  if (BLOCKED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) return refuse("not-public");

  url.hostname = host;
  url.hash = "";
  return { ok: true, url };
}

const V4 = /^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$/;

function parseV4(ip: string): number | null {
  const m = V4.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((n) => n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// [network, prefix length]: private, loopback, link-local, CGNAT, documentation, benchmarking, multicast, reserved.
const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

function publicV4(n: number): boolean {
  return !BLOCKED_V4.some(([net, bits]) => {
    const base = parseV4(net) as number;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) >>> 0 === (base & mask) >>> 0;
  });
}

function parseV6(ip: string): number[] | null {
  if (!/^[0-9a-f:.]+$/i.test(ip) || ip.includes(":::")) return null;
  let text = ip;
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (tail) {
    const v4 = parseV4(tail[1]);
    if (v4 === null) return null;
    text = `${text.slice(0, -tail[1].length)}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const side = (s: string) => (s === "" ? [] : s.split(":"));
  const head = side(halves[0]);
  const rest = halves.length === 2 ? side(halves[1]) : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const groups = halves.length === 1 ? head : [...head, ...Array(missing).fill("0"), ...rest];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
}

const v4From = (hi: number, lo: number) => ((hi << 16) | lo) >>> 0;

/** True only for addresses on the public internet. Anything unparseable is refused. */
export function isPublicAddress(ip: string): boolean {
  const v4 = parseV4(ip);
  if (v4 !== null) return publicV4(v4);

  const g = parseV6(ip);
  if (!g) return false;
  const zeros = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);

  if (zeros(0, 5) && g[5] === 0xffff) return publicV4(v4From(g[6], g[7])); // ::ffff:a.b.c.d
  if (zeros(0, 6)) return false; // ::, ::1 and IPv4-compatible forms
  if (g[0] === 0x64 && g[1] === 0xff9b) return g[2] === 0 && zeros(2, 6) ? publicV4(v4From(g[6], g[7])) : false; // NAT64
  if (g[0] === 0x2002) return publicV4(v4From(g[1], g[2])); // 6to4
  if ((g[0] & 0xe000) !== 0x2000) return false; // outside global unicast 2000::/3
  if (g[0] === 0x2001 && (g[1] === 0x0db8 || g[1] === 0)) return false; // documentation, Teredo
  return true;
}
