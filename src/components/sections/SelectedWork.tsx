import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { workItems } from "@/data/work";

export function SelectedWork() {
  return (
    <section id="work" className="section-solid relative py-28 md:py-36">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Selected solutions</p>
              <h2 className="mt-5 max-w-2xl text-h2">
                Strong outcomes, told through the problem.
              </h2>
            </div>
            <p className="max-w-xs text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_60%,transparent)]">
              Representative engagement shapes. Named client case studies are
              added here once approved for publication.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col gap-5">
          {workItems.map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <article className="group grid gap-8 rounded-2xl border border-[rgba(220,235,228,0.1)] bg-[rgba(8,19,15,0.5)] p-8 backdrop-blur-sm transition-colors hover:border-[rgba(197,138,46,0.4)] md:grid-cols-[auto_1fr] md:p-10">
                <div className="flex items-start gap-4 md:flex-col md:gap-2">
                  <span className="font-mono text-sm text-amber">{item.index}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate">
                    {item.discipline}
                  </span>
                </div>

                <div>
                  <h3 className="text-h3">{item.title}</h3>
                  <dl className="mt-6 grid gap-6 md:grid-cols-3">
                    {[
                      ["Problem", item.problem],
                      ["Approach", item.approach],
                      ["Outcome", item.outcome],
                    ].map(([label, body]) => (
                      <div key={label}>
                        <dt className="text-xs uppercase tracking-[0.18em] text-mint">
                          {label}
                        </dt>
                        <dd className="mt-2 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_74%,transparent)]">
                          {body}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {item.placeholder ? (
                    <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(220,235,228,0.12)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-slate">
                      Illustrative example
                    </p>
                  ) : null}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
