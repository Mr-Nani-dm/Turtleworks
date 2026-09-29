import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/Icons";
import { SectionLink } from "@/components/ui/SectionLink";
import { Reveal } from "@/components/motion/Reveal";
import { processSteps } from "@/data/process";

/*
  How we work: one section for the whole engagement. Three stages that
  each stand on their own, so a client can stop after the first.
*/
export function ProcessTimeline() {
  return (
    <section id="process" aria-labelledby="process-title" className="section-solid relative py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <h2 id="process-title" className="text-h2">
            Not more.
            <br />
            <span className="text-mint">The right next step.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory-soft">
            Three stages. Each one stands on its own, so you can stop after the first
            with a clear recommendation and nothing else to buy.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {processSteps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 90} className="relative flex flex-col">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory font-display text-sm font-semibold tabular-nums text-ink">
                  {i + 1}
                </span>
                <span aria-hidden className="hidden h-px flex-1 bg-[rgba(220,235,228,0.18)] md:block" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-ivory">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-ivory-soft">{step.body}</p>
              <p className="mt-5 border-t border-[rgba(220,235,228,0.12)] pt-4 text-mint">
                <span className="text-sage">You get: </span>
                {step.youGet}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3">
          <SectionLink
            id="contact"
            className="group inline-flex min-h-11 items-center gap-2 font-medium text-ivory underline decoration-[color-mix(in_srgb,var(--color-amber)_70%,transparent)] underline-offset-4 active:opacity-80"
          >
            Start with a conversation
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </SectionLink>
          <SectionLink
            id="faq"
            className="inline-flex min-h-11 items-center text-sm text-ivory-muted underline-offset-4 transition-colors hover:text-ivory hover:underline"
          >
            How pricing works
          </SectionLink>
        </Reveal>
      </Container>
    </section>
  );
}
