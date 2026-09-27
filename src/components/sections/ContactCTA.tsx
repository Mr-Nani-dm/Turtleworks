import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/data/site";

export function ContactCTA() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[80svh] items-center py-28 md:py-40"
    >
      <Container>
        <div className="max-w-3xl">
          <Reveal>
            <div className="hairline w-24" />
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-8 text-h1 font-semibold">
              Have a problem worth solving?
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-xl text-[color:color-mix(in_srgb,var(--color-ivory)_82%,transparent)]">
              Let&rsquo;s understand it first.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={`mailto:${site.email}`} variant="primary">
                Start a conversation
              </Button>
              <a
                href={`mailto:${site.email}`}
                className="text-sm text-mint underline-offset-4 hover:underline"
              >
                {site.email}
              </a>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
