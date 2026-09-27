import Link from "next/link";
import { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

type PageShellProps = {
  title: string;
  intro?: ReactNode;
  updated?: string;
  children: ReactNode;
};

/** Calm reading layout for secondary pages (legal, confirmations, 404). */
export function PageShell({ title, intro, updated, children }: PageShellProps) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(120%_60%_at_20%_0%,rgba(29,91,70,0.22),transparent_60%)]">
      <header className="border-b border-[rgba(220,235,228,0.08)]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Container className="flex min-h-[var(--nav-h)] items-center justify-between gap-4">
          <Link href="/" aria-label="TurtleWorks home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)] transition-colors hover:text-ivory"
          >
            Back to home <ArrowRight size={14} />
          </Link>
        </Container>
      </header>

      <main id="top">
        <Container className="py-20 md:py-28">
          <article className="max-w-[68ch]">
            <div className="hairline w-24" />
            <h1 className="mt-8 text-h1 font-semibold">{title}</h1>
            {updated ? <p className="mt-4 text-sm text-sage">Last updated {updated}</p> : null}
            {intro ? (
              <div className="page-intro mt-6 text-lg leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_84%,transparent)]">
                {intro}
              </div>
            ) : null}
            <div className="prose-tw mt-12">{children}</div>
          </article>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
