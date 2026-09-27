import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GoldMark } from "@/components/ui/GoldMark";
import { Reveal } from "@/components/motion/Reveal";
import { services } from "@/data/services";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center pb-16 pt-[calc(var(--nav-h)+1.5rem)] md:pb-20"
    >
      <Container className="w-full">
        <div className="max-w-2xl">
          <Reveal className="flex items-center gap-4">
            <GoldMark size={34} />
            <Eyebrow>Business Solutions + Technology</Eyebrow>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-mega font-semibold leading-[0.98]">
              Small steps.
              <br />
              <span className="text-mint">Bigger possibilities.</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_82%,transparent)]">
              We understand the problem first, then design the right mix of
              technology, automation, digital experience and business solutions
              around what you actually need.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="#solutions" variant="primary">
                Explore what we do
              </Button>
              <Button href="#contact" variant="ghost">
                Start a conversation
              </Button>
            </div>
          </Reveal>

          <Reveal delay={380}>
            <ul
              aria-label="What we do"
              className="mt-10 flex max-w-xl flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_72%,transparent)]"
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
          </Reveal>
        </div>
      </Container>

      {/* Scroll cue */}
      <Reveal
        delay={500}
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block [@media(max-height:860px)]:hidden"
      >
        <span className="flex flex-col items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-[color:color-mix(in_srgb,var(--color-mint)_60%,transparent)]">
          Scroll
          <span className="h-9 w-px bg-gradient-to-b from-[rgba(220,235,228,0.5)] to-transparent" />
        </span>
      </Reveal>
    </section>
  );
}
