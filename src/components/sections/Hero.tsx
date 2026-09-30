import { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

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
      className="relative flex min-h-[100svh] items-end pb-12 pt-[calc(var(--nav-h)+1.5rem)] md:items-center md:pb-20"
    >
      {/* Local scrim behind the copy: uniform on small screens (the film's
          bright centre sits behind the text there), a soft pool on desktop
          that fades out before the turtle. */}
      {/* Portrait phones: the turtle fills the upper screen, so the scrim
          starts clear and deepens where the copy sits. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_32%,rgba(5,9,8,0.45)_48%,rgba(5,9,8,0.6)_100%)] md:bg-none md:bg-[rgba(5,9,8,0.52)] lg:bg-transparent lg:bg-[radial-gradient(ellipse_62%_78%_at_24%_52%,rgba(5,9,8,0.74),rgba(5,9,8,0.36)_58%,transparent_82%)]"
      />
      <Container className="relative w-full">
        <div className="max-w-3xl">
          <Enter>
            <p className="mb-5 inline-flex rounded-full border border-[rgba(224,168,82,0.35)] bg-[rgba(8,19,15,0.62)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-md">
              More clarity. Better enquiries. Less manual follow-up.
            </p>
          </Enter>

          <Enter delay={80}>
            <h1 className="text-h1 font-semibold leading-[1.02]">
              Get found. <span className="text-mint">Get trusted.</span>{" "}
              <span className="text-gold">Get better enquiries.</span>
            </h1>
          </Enter>

          <Enter delay={160}>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ivory-soft">
              TurtleWorks builds websites, automations, and dashboards that bring more clarity,
              stronger follow-ups, and less manual work to growing businesses.
            </p>
          </Enter>

          <Enter delay={240}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="#solutions" variant="primary">
                Show me the solutions
              </Button>
              <Button href="#contact" variant="ghost">
                Start a conversation
              </Button>
            </div>
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
