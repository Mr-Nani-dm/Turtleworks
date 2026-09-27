import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Message not sent",
  robots: { index: false, follow: false },
};

export default function ThanksIssuePage() {
  return (
    <PageShell
      title="Your message wasn’t sent."
      intro={
        <p>
          Something went wrong, or a field needed attention. Please go back and
          try again
          {site.email ? (
            <>
              {" "}— or write to <a href={`mailto:${site.email}`}>{site.email}</a>
            </>
          ) : null}
          .
        </p>
      }
    >
      <Button href="/#contact">Back to the form</Button>
    </PageShell>
  );
}
