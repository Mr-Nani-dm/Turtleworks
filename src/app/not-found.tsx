import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { GoldMark } from "@/components/ui/GoldMark";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell
      title="This page swam off somewhere."
      intro={
        <p>
          The link may be old, or the address mistyped. Everything we do is on
          the home page — it&rsquo;s a short swim back.
        </p>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button href="/">Back to home</Button>
        <Button href="/#contact" variant="ghost">
          Start a conversation
        </Button>
      </div>
      <div className="mt-16 flex items-center gap-3 text-sm text-sage">
        <GoldMark size={18} />
        Small steps. Bigger possibilities.
      </div>
    </PageShell>
  );
}
