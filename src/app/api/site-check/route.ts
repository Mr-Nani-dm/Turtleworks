import { parseTargetUrl } from "@/lib/site-check/safe-url";
import { safeFetch } from "@/lib/site-check/safe-fetch";
import { analyzePage, summarize } from "@/lib/site-check/analyze";
import type { PageData } from "@/lib/site-check/types";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;
const RATE_MAX_KEYS = 2_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.delete(ip);
  hits.set(ip, recent);
  for (const key of hits.keys()) {
    if (hits.size <= RATE_MAX_KEYS) break;
    hits.delete(key);
  }
  return recent.length > RATE_MAX;
}

async function probe(base: URL, path: string): Promise<string | null> {
  const url = new URL(path, base);
  const result = await safeFetch(url, { timeoutMs: 4_000, maxBytes: 200_000, maxRedirects: 2 });
  if (!result.ok || result.status >= 400) return null;
  return result.body;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (rateLimited(ip)) return Response.json({ ok: false, error: "rate-limited" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const raw = String(body.url ?? "").trim();
  if (!raw) return Response.json({ ok: false, error: "missing-url" }, { status: 400 });

  const parsed = parseTargetUrl(raw);
  if (!parsed.ok) return Response.json({ ok: false, error: "invalid-url", reason: parsed.reason }, { status: 400 });

  const result = await safeFetch(parsed.url, { timeoutMs: 6_000, maxBytes: 1_500_000, maxRedirects: 4 });
  if (!result.ok) return Response.json({ ok: false, error: "fetch-failed", reason: result.reason }, { status: 502 });

  const base = new URL(result.finalUrl);
  const [robotsTxt, sitemapBody, llmsTxt] = await Promise.all([
    probe(base, "/robots.txt"),
    probe(base, "/sitemap.xml"),
    probe(base, "/llms.txt"),
  ]);

  const pageData: PageData = {
    finalUrl: result.finalUrl,
    status: result.status,
    headers: result.headers,
    html: result.body,
    htmlTruncated: result.truncated,
    robotsTxt,
    sitemapFound: sitemapBody !== null && sitemapBody.includes("<"),
    llmsTxtFound: llmsTxt !== null && llmsTxt.length > 10,
  };

  const categories = analyzePage(pageData, new Date());
  const summary = summarize(categories);

  return Response.json({ ok: true, url: result.finalUrl, categories, summary });
}
