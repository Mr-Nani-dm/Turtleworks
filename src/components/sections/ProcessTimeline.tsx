import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { processSteps } from "@/data/process";

export function ProcessTimeline() {
  return (
    <section id="process" className="section-solid relative py-28 md:py-36">
      <Container>
        <Reveal>
          <Eyebrow>How we work</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-h2">
            A calm, deliberate way of moving a business forward.
          </h2>
          <p className="mt-6 max-w-xl text-[color:color-mix(in_srgb,var(--color-ivory)_72%,transparent)]">
            Five steps, applied at the right depth for the work. No unnecessary
            cross-selling — only what earns its place.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[rgba(220,235,228,0.1)] bg-[rgba(220,235,228,0.06)] md:grid-cols-5">
          {processSteps.map((step, i) => (
            <Reveal
              as="li"
              key={step.index}
              delay={i * 80}
              className="flex flex-col bg-[rgba(8,19,15,0.5)] p-7"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium tabular-nums text-amber">{step.index}</span>
                <span className="h-px flex-1 bg-[rgba(220,235,228,0.14)]" />
              </div>
              <h3 className="mt-5 font-display text-xl text-ivory">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_70%,transparent)]">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
