import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

/*
  Website terms of use (not client engagement terms). Add governing law and
  registered business details for your jurisdiction, and have it reviewed.
*/

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the TurtleWorks website.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "27 September 2026";

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of use"
      updated={UPDATED}
      intro={
        <p>
          These terms cover your use of this website. Any work we do together is
          agreed separately, in writing.
        </p>
      }
    >
      <h2>Information on this site</h2>
      <p>
        Content here describes how TurtleWorks works and what we can help with.
        It&rsquo;s general information, not professional advice for your specific
        situation, and not an offer to provide services on particular terms.
      </p>

      <h2>Examples</h2>
      <p>
        Engagement examples marked &ldquo;Illustrative&rdquo; describe typical
        shapes of work. They are not accounts of specific client projects or
        results.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The TurtleWorks name, logo, text, film and design of this site belong to
        TurtleWorks. Please don&rsquo;t reuse them without permission.
      </p>

      <h2>Links to other sites</h2>
      <p>
        Where we link to other websites, we&rsquo;re not responsible for their
        content or how they handle your information.
      </p>

      <h2>Availability</h2>
      <p>
        We aim to keep this site accurate and available, but it&rsquo;s provided
        as-is and may change or be unavailable at times.
      </p>

      <h2>Your privacy</h2>
      <p>
        How we handle information you send us is set out in our{" "}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </PageShell>
  );
}
