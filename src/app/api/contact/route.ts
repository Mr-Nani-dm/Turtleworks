import { validateContact } from "@/lib/contact-schema";
import { deliverEnquiry } from "@/lib/contact-delivery";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2_500;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
const RATE_MAX_KEYS = 5_000;

/*
  Best-effort, per-instance limiter (serverless instances don't share memory).
  For real flood protection add a Vercel Firewall rate-limit rule on
  /api/contact — see README.
*/
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.delete(ip);
  hits.set(ip, recent); // re-insert so Map order = least recently seen first
  // Evict least-recently-seen addresses; never wipe everyone's counters.
  for (const key of hits.keys()) {
    if (hits.size <= RATE_MAX_KEYS) break;
    hits.delete(key);
  }
  return recent.length > RATE_MAX;
}

/** Reads at most MAX_BODY_BYTES regardless of what content-length claims. */
async function readCapped(request: Request): Promise<string | "too-large" | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return "too-large";
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

function samePath(referer: string | null, origin: string) {
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    return url.origin === origin ? url.pathname : "/";
  } catch {
    return "/";
  }
}

export async function POST(request: Request) {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const isJson = type === "application/json";
  const isHtmlForm = type === "application/x-www-form-urlencoded";
  const origin = new URL(request.url).origin;

  const respond = (status: number, body: Record<string, unknown>) => {
    if (isHtmlForm) {
      const target = status === 200 ? "/thanks" : "/thanks/issue";
      return Response.redirect(new URL(target, origin), 303);
    }
    return Response.json(body, { status });
  };

  if (!isJson && !isHtmlForm) return Response.json({ ok: false, error: "unsupported" }, { status: 415 });

  // Browsers always send Origin on POST (and Sec-Fetch-Site). Scripts that
  // omit both, or come from elsewhere, are refused.
  const requestOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const sameOrigin = requestOrigin ? requestOrigin === origin : fetchSite === "same-origin";
  if (!sameOrigin) return respond(403, { ok: false, error: "forbidden" });

  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (rateLimited(ip)) return respond(429, { ok: false, error: "rate-limited" });

  const raw = await readCapped(request);
  if (raw === "too-large") return respond(413, { ok: false, error: "too-large" });
  if (!raw) return respond(400, { ok: false, error: "invalid-body" });

  let body: Record<string, unknown>;
  try {
    body = isJson ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("shape");
  } catch {
    return respond(400, { ok: false, error: "invalid-body" });
  }

  // Spam traps: a hidden field humans never fill, and a minimum fill time.
  // The JS form always sends its start time; the no-JS form can't, so only
  // JSON requests must carry it. Bots get a normal-looking success.
  const startedAt = Number(body.startedAt);
  const hasStart = Number.isFinite(startedAt) && startedAt > 1_600_000_000_000;
  const tooFast = hasStart && Date.now() - startedAt < MIN_FILL_MS;
  if (String(body.website ?? "").trim() || tooFast || (isJson && !hasStart)) {
    return respond(200, { ok: true });
  }

  const result = validateContact(body);
  if (!result.ok) return respond(400, { ok: false, error: "invalid", errors: result.errors });

  const delivered = await deliverEnquiry(result.data, {
    submittedAt: new Date().toISOString(),
    page: samePath(request.headers.get("referer"), origin),
  });

  if (!delivered.ok) {
    console.error(`[contact] delivery failed: ${delivered.reason}`);
    const status = delivered.reason === "not-configured" ? 503 : 502;
    return respond(status, { ok: false, error: "delivery-failed" });
  }

  return respond(200, { ok: true });
}
