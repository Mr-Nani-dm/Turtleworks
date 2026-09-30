import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import zlib from "node:zlib";
import { isPublicAddress, parseTargetUrl } from "./safe-url";

/*
  Fetches a public web page on behalf of a stranger, without letting them aim
  the server at anything internal. Defences, in order:
    1. every URL (first hop and each redirect) must pass validateUrl;
    2. every address the hostname resolves to must be public, checked inside the
       DNS lookup used to open the connection, so DNS rebinding cannot slip a
       private address in after the check;
    3. hard limits on time, redirects and decoded size (a gzip bomb is cut off);
    4. failures return a short reason only, never internal error text.
*/

export type Resolved = { address: string; family: number };
export type FetchPolicy = {
  /** Returns null to allow the URL, or a reason to refuse it. */
  validateUrl: (url: URL) => string | null;
  allowAddress: (ip: string) => boolean;
};
export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  policy?: Partial<FetchPolicy>;
  resolve?: (hostname: string) => Promise<Resolved[]>;
};
export type FailureReason = "blocked-url" | "blocked-address" | "timeout" | "too-many-redirects" | "bad-redirect" | "unsupported-encoding" | "network";
export type SafeFetchResult =
  | { ok: true; status: number; finalUrl: string; headers: Record<string, string>; body: string; truncated: boolean; redirects: number }
  | { ok: false; reason: FailureReason };

const USER_AGENT = "Mozilla/5.0 (compatible; TurtleWorksSiteCheck/1.0; +https://www.turtleworks.in/website-check)";
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const BLOCKED = "TW_BLOCKED_ADDRESS";

type Hop = { kind: "response"; status: number; headers: Record<string, string>; body: string; truncated: boolean } | { kind: "error"; reason: FailureReason };

const defaultResolve = async (hostname: string): Promise<Resolved[]> => dns.promises.lookup(hostname, { all: true, verbatim: true });
const defaultValidate = (url: URL) => (parseTargetUrl(url.href).ok ? null : "blocked");

function flatten(headers: http.IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) out[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  return out;
}

function decoderFor(encoding: string) {
  switch (encoding.trim().toLowerCase()) {
    case "":
    case "identity":
      return null;
    case "gzip":
    case "x-gzip":
      return zlib.createGunzip({ finishFlush: zlib.constants.Z_SYNC_FLUSH });
    case "deflate":
      return zlib.createInflate({ finishFlush: zlib.constants.Z_SYNC_FLUSH });
    case "br":
      return zlib.createBrotliDecompress();
    default:
      return undefined;
  }
}

export async function safeFetch(target: string | URL, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 6_000;
  const maxBytes = opts.maxBytes ?? 1_500_000;
  const maxRedirects = opts.maxRedirects ?? 4;
  const validateUrl = opts.policy?.validateUrl ?? defaultValidate;
  const allowAddress = opts.policy?.allowAddress ?? isPublicAddress;
  const resolve = opts.resolve ?? defaultResolve;

  const lookup = ((hostname, options, callback) => {
    resolve(hostname).then(
      (addresses) => {
        if (!addresses.length || addresses.some((a) => !allowAddress(a.address))) {
          return callback(Object.assign(new Error("blocked address"), { code: BLOCKED }), "", 0);
        }
        if (options.all) return callback(null, addresses);
        return callback(null, addresses[0].address, addresses[0].family);
      },
      (error) => callback(error, "", 0),
    );
  }) as LookupFunction;

  let current: URL;
  try {
    current = new URL(typeof target === "string" ? target : target.href);
  } catch {
    return { ok: false, reason: "blocked-url" };
  }

  let timedOut = false;
  let abort: (() => void) | null = null;
  const timer = setTimeout(() => {
    timedOut = true;
    abort?.();
  }, timeoutMs);

  const hop = (url: URL): Promise<Hop> =>
    new Promise((resolveHop) => {
      let settled = false;
      const done = (result: Hop) => {
        if (!settled) {
          settled = true;
          resolveHop(result);
        }
      };
      const lib = url.protocol === "https:" ? https : http;
      let stream: NodeJS.ReadableStream | null = null;
      const req = lib.request(
        url,
        {
          method: "GET",
          agent: false,
          lookup,
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en",
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          const headers = flatten(res.headers);
          abort = () => {
            req.destroy();
            res.destroy();
            done({ kind: "error", reason: "timeout" });
          };
          if (REDIRECTS.has(status)) {
            res.resume();
            return done({ kind: "response", status, headers, body: "", truncated: false });
          }
          const decoder = decoderFor(headers["content-encoding"] ?? "");
          if (decoder === undefined) {
            res.destroy();
            return done({ kind: "error", reason: "unsupported-encoding" });
          }
          const chunks: Buffer[] = [];
          let size = 0;
          let truncated = false;
          const finish = () => {
            done({ kind: "response", status, headers, body: Buffer.concat(chunks).toString("utf8"), truncated });
            res.destroy();
            decoder?.destroy();
          };
          stream = decoder ? res.pipe(decoder) : res;
          stream.on("data", (chunk: Buffer) => {
            if (settled) return;
            if (size + chunk.length > maxBytes) {
              chunks.push(chunk.subarray(0, maxBytes - size));
              size = maxBytes;
              truncated = true;
              return finish();
            }
            chunks.push(chunk);
            size += chunk.length;
          });
          stream.on("end", finish);
          stream.on("error", () => (truncated || size > 0 ? finish() : done({ kind: "error", reason: "network" })));
          res.on("error", () => done({ kind: "error", reason: "network" }));
          res.on("aborted", () => done({ kind: "error", reason: "network" }));
          res.on("close", () => {
            if (!settled && !res.complete) done({ kind: "error", reason: "network" });
          });
        },
      );
      abort = () => {
        req.destroy();
        done({ kind: "error", reason: "timeout" });
      };
      req.on("error", (error: NodeJS.ErrnoException) => done({ kind: "error", reason: error.code === BLOCKED ? "blocked-address" : "network" }));
      req.end();
    });

  try {
    let redirects = 0;
    for (;;) {
      if ((current.protocol !== "http:" && current.protocol !== "https:") || validateUrl(current) !== null) {
        return { ok: false, reason: "blocked-url" };
      }
      const host = current.hostname.replace(/^\[|\]$/g, "");
      if (isIP(host) && !allowAddress(host)) return { ok: false, reason: "blocked-address" };

      const result = await hop(current);
      if (result.kind === "error") return { ok: false, reason: timedOut ? "timeout" : result.reason };

      if (REDIRECTS.has(result.status)) {
        const location = result.headers.location;
        if (!location) return { ok: false, reason: "bad-redirect" };
        if (++redirects > maxRedirects) return { ok: false, reason: "too-many-redirects" };
        try {
          current = new URL(location, current);
        } catch {
          return { ok: false, reason: "bad-redirect" };
        }
        continue;
      }
      return { ok: true, status: result.status, finalUrl: current.href, headers: result.headers, body: result.body, truncated: result.truncated, redirects };
    }
  } finally {
    clearTimeout(timer);
  }
}
