import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { engagementModels } from "@/data/engagement";

export function Engagement() {
  return (
    <section
      id="engage"
      aria-labelledby="engage-title"
      className="section-solid relative py-28 md:py-36"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <Eyebrow>How we engage</Eyebrow>
            <h2 id="engage-title" className="mt-5 text-h2">
              Start small. Commit when it&rsquo;s clear.
            </h2>
            <p className="mt-6 max-w-md text-[color:color-mix(in_srgb,var(--color-ivory)_76%,transparent)]">
              Every engagement is scoped to the problem. You can stop after
              discovery with a clear recommendation, or carry on into delivery
              and improvement.
            </p>
          </Reveal>

          <ol className="border-t border-[rgba(220,235,228,0.12)]">
            {engagementModels.map((model, i) => (
              <Reveal
                as="li"
                key={model.name}
                delay={i * 80}
                className="grid gap-3 border-b border-[rgba(220,235,228,0.12)] py-8 md:grid-cols-[11rem_1fr] md:gap-8"
              >
                <h3 className="font-display text-2xl text-ivory">{model.name}</h3>
                <div>
                  <p className="leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)]">
                    {model.purpose}
                  </p>
                  <p className="mt-3 flex gap-3 text-sm text-mint">
                    <span aria-hidden className="mt-2 h-px w-5 shrink-0 bg-amber" />
                    <span>
                      <span className="sr-only">You get: </span>
                      {model.youGet}
                    </span>
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
