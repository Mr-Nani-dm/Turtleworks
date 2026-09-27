import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Message sent",
  robots: { index: false, follow: false },
};

export default function ThanksPage() {
  return (
    <PageShell
      title="Thanks — your message is with us."
      intro={<p>We&rsquo;ll read it properly and reply personally to arrange a conversation.</p>}
    >
      <Button href="/">Back to home</Button>
    </PageShell>
  );
}
