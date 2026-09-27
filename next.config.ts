import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isPreview = process.env.VERCEL_ENV === "preview";

// Static-friendly CSP (no nonces), per Next.js "Without Nonces" guidance.
// 'unsafe-inline' is required for Next's inline bootstrap scripts on static
// pages; inline event-handler attributes stay blocked (script-src-attr).
// Vercel Web Analytics loads from this origin (/_vercel/insights), so it needs
// nothing extra. Preview deployments also allow the Vercel toolbar.
const toolbar = isPreview
  ? {
      script: " https://vercel.live",
      style: " https://vercel.live",
      img: " https://vercel.live https://vercel.com",
      font: " https://vercel.live https://assets.vercel.com",
      connect: " https://vercel.live wss://ws-us3.pusher.com",
      frame: "https://vercel.live",
    }
  : { script: "", style: "", img: "", font: "", connect: "", frame: "'none'" };

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${toolbar.script}`,
  "script-src-attr 'none'",
  `style-src 'self' 'unsafe-inline'${toolbar.style}`,
  `img-src 'self' data: blob:${toolbar.img}`,
  `font-src 'self'${toolbar.font}`,
  "media-src 'self'",
  `connect-src 'self'${toolbar.connect}`,
  `frame-src ${toolbar.frame}`,
  "manifest-src 'self'",
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
