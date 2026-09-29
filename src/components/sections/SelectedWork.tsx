import { Container } from "@/components/ui/Container";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { ProofScene } from "@/components/sections/ProofScene";
import { proof } from "@/data/work";
import { site } from "@/data/site";

/*
  Proof: real systems we built and run for ourselves, stated only in
  checkable facts. Client case studies join this section once approved.
*/
export function SelectedWork() {
  const pageSpeed = `https://pagespeed.web.dev/report?url=${encodeURIComponent(site.url)}`;

  return (
    <section id="work" aria-labelledby="work-title" className="section-solid relative py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <h2 id="work-title" className="text-h2">
            We run our own business
            <br />
            <span className="text-mint">on what we sell.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory-soft">
            Before we build it for you, we build it for ourselves. Two working systems
            you can check today.
          </p>
        </Reveal>

        <div className="mt-16 flex flex-col gap-20 md:mt-20 md:gap-28">
          {proof.map((item, i) => (
            <article key={item.id} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className={i % 2 ? "lg:order-2" : ""}>
                <h3 className="text-h3">{item.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-ivory-soft">{item.body}</p>
                <ul className="mt-6 space-y-3">
                  {item.facts.map((fact) => (
                    <li key={fact} className="flex gap-3 leading-relaxed text-ivory-soft">
                      <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                      {fact}
                    </li>
                  ))}
                </ul>
                {item.id === "website" ? (
                  <a
                    href={pageSpeed}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-7 inline-flex min-h-11 items-center gap-2 font-medium text-ivory underline decoration-[color-mix(in_srgb,var(--color-amber)_70%,transparent)] underline-offset-4"
                  >
                    Check the scores yourself
                    <ArrowUpRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="sr-only">(opens Google PageSpeed Insights in a new tab)</span>
                  </a>
                ) : null}
              </Reveal>
              <ProofScene id={item.id} />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
