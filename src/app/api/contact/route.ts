import { validateContact } from "@/lib/contact-schema";
import { deliverEnquiry } from "@/lib/contact-delivery";

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 2_500;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;

// Best-effort, per-instance limiter; serverless instances don't share memory.
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > RATE_MAX;
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return await request.json();
    if (type.includes("form")) return Object.fromEntries(await request.formData());
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  const isHtmlForm = !(request.headers.get("content-type") ?? "").includes("application/json");
  const origin = new URL(request.url).origin;

  const respond = (status: number, body: Record<string, unknown>) => {
    if (isHtmlForm) {
      const target = status === 200 ? "/thanks" : "/thanks/issue";
      return Response.redirect(new URL(target, origin), 303);
    }
    return Response.json(body, { status });
  };

  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== origin) {
    return respond(403, { ok: false, error: "forbidden" });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return respond(413, { ok: false, error: "too-large" });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return respond(429, { ok: false, error: "rate-limited" });
  }

  const body = await readBody(request);
  if (!body) return respond(400, { ok: false, error: "invalid-body" });

  // Spam traps: a hidden field humans never fill, and a minimum fill time.
  // Bots get a normal-looking success so they don't adapt.
  const startedAt = Number(body.startedAt);
  const tooFast = Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS;
  if (String(body.website ?? "").trim() || tooFast) {
    return respond(200, { ok: true });
  }

  const result = validateContact(body);
  if (!result.ok) return respond(400, { ok: false, error: "invalid", errors: result.errors });

  const delivered = await deliverEnquiry(result.data, {
    submittedAt: new Date().toISOString(),
    page: request.headers.get("referer") ?? origin,
  });

  if (!delivered.ok) {
    console.error(`[contact] delivery failed: ${delivered.reason}`);
    const status = delivered.reason === "not-configured" ? 503 : 502;
    return respond(status, { ok: false, error: delivered.reason });
  }

  return respond(200, { ok: true });
}
