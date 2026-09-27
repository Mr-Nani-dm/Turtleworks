import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isPreview = process.env.VERCEL_ENV === "preview";
const analytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1";

// Static-friendly CSP (no nonces), per Next.js "Without Nonces" guidance.
// 'unsafe-inline' is required for Next's inline bootstrap scripts on static pages.
const vercelLive = isPreview ? " https://vercel.live" : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${analytics ? " https://va.vercel-scripts.com" : ""}${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${vercelLive}`,
  `font-src 'self'${vercelLive}`,
  "media-src 'self'",
  `connect-src 'self'${vercelLive}`,
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Film + poster: cache for 30 days. Rename the file if you replace it.
        source: "/videos/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
