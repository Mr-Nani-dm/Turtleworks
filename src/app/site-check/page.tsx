import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SiteCheckForm } from "./SiteCheckForm";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = pageMetadata({
  path: "/site-check",
  title: "Free website check",
  description:
    "Paste your website URL and get an instant audit: SEO basics, AI readiness, contact routes, trust signals and performance. Free, no sign-up.",
});

export default function SiteCheckPage() {
  return (
    <PageShell
      title="Website check"
      intro={
        <p>
          Paste your website address and we&rsquo;ll run 30+ checks across SEO,
          performance, accessibility, trust and AI readiness &mdash; each one
          grounded in a published standard. Takes about ten seconds.
        </p>
      }
    >
      <SiteCheckForm />
    </PageShell>
  );
}
