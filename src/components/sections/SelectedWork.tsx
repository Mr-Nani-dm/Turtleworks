import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { workItems } from "@/data/work";

export function SelectedWork() {
  const illustrative = workItems.every((item) => item.placeholder);

  return (
    <section id="work" className="section-solid relative py-28 md:py-36">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="max-w-2xl text-h2">
                {illustrative
                  ? "Problems we're built to solve."
                  : "Outcomes, told through the problem."}
              </h2>
            </div>
            {illustrative ? (
              <p className="max-w-xs text-sm text-ivory-muted">
                Typical situations and how we would approach them — not client
                case studies. Those appear here once approved for publication.
              </p>
            ) : null}
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col gap-5">
          {workItems.map((item, i) => {
            const rows: [string, string][] = item.placeholder
              ? [
                  ["The situation", item.problem],
                  ["How we'd approach it", item.approach],
                  ["What good looks like", item.outcome],
                ]
              : [
                  ["Problem", item.problem],
                  ["Approach", item.approach],
                  ["Outcome", item.outcome],
                ];
            return (
              <Reveal key={item.id} delay={i * 80}>
                <article className="grid gap-8 rounded-2xl border border-[rgba(220,235,228,0.1)] bg-[rgba(8,19,15,0.72)] p-7 md:p-10 lg:grid-cols-[minmax(10rem,auto)_1fr]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-col lg:items-start">
                    <span className="text-xs uppercase tracking-[0.2em] text-sage">
                      {item.discipline}
                    </span>
                    {item.placeholder ? (
                      <span className="rounded-full border border-[rgba(220,235,228,0.18)] px-2.5 py-0.5 text-xs text-ivory-muted">
                        Illustrative
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-h3">{item.title}</h3>
                    <dl className="mt-6 grid gap-6 lg:grid-cols-3">
                      {rows.map(([label, body]) => (
                        <div key={label}>
                          <dt className="text-xs uppercase tracking-[0.18em] text-mint">
                            {label}
                          </dt>
                          <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ivory-soft">
                            {body}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
