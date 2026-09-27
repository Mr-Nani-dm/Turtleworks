/*
  Cookie-free, aggregate Vercel Web Analytics. Enable Web Analytics in the
  Vercel dashboard first, then set NEXT_PUBLIC_ENABLE_ANALYTICS=1 and redeploy.
  Uses Vercel's same-origin script tag directly, so nothing ships while off.
*/
export function AnalyticsGate() {
  if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "1") return null;
  return <script defer src="/_vercel/insights/script.js" />;
}
