import { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GoldMark } from "@/components/ui/GoldMark";
import { services } from "@/data/services";

/** CSS-only entrance: paints with the first frame, no hydration needed (LCP-safe). */
function Enter({ delay = 0, className = "", children }: { delay?: number; className?: string; children: ReactNode }) {
  return (
    <div className={`enter ${className}`} style={{ "--enter-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center pb-16 pt-[calc(var(--nav-h)+1.5rem)] md:pb-20"
    >
      <Container className="w-full">
        <div className="max-w-2xl">
          <Enter className="flex items-center gap-4">
            <GoldMark size={34} />
            <Eyebrow>Business Solutions + Technology</Eyebrow>
          </Enter>

          <Enter delay={60}>
            <h1 className="mt-6 text-mega font-semibold leading-[0.98]">
              Small steps.
              <br />
              <span className="text-mint">Bigger possibilities.</span>
            </h1>
          </Enter>

          <Enter delay={140}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ivory-soft">
              We understand the problem first, then design the right mix of
              technology, automation, digital experience and business solutions
              around what you actually need.
            </p>
          </Enter>

          <Enter delay={220}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="#solutions" variant="primary">
                Explore what we do
              </Button>
              <Button href="#contact" variant="ghost">
                Start a conversation
              </Button>
            </div>
          </Enter>

          <Enter delay={300}>
            <ul
              aria-label="What we do"
              className="mt-10 flex max-w-xl flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ivory-muted"
            >
              {services.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3">
                  {i > 0 ? (
                    <span aria-hidden className="h-1 w-1 rounded-full bg-amber/70" />
                  ) : null}
                  {s.short}
                </li>
              ))}
            </ul>
          </Enter>
        </div>
      </Container>

      <Enter
        delay={500}
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block [@media(max-height:860px)]:hidden"
      >
        <span aria-hidden className="flex flex-col items-center gap-2 text-xs uppercase tracking-[0.28em] text-sage">
          Scroll
          <span className="h-9 w-px bg-gradient-to-b from-[rgba(220,235,228,0.5)] to-transparent" />
        </span>
      </Enter>
    </section>
  );
}
