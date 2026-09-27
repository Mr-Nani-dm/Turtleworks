import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { principles } from "@/data/site";

export function Principles() {
  return (
    <section id="why" className="section-solid relative py-28 md:py-36">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <Reveal>
            <Eyebrow>Why TurtleWorks</Eyebrow>
            <h2 className="mt-6 text-h1 font-semibold">
              Technology is useful only when it solves the right problem.
            </h2>
          </Reveal>

          <div className="lg:pt-4">
            <Reveal delay={120}>
              <p className="max-w-md text-ivory-soft">
                We are practical by default: evidence over assumptions,
                right-sized over impressive, maintainable over clever. The turtle
                is deliberate — small steps, made with intent, that add up.
              </p>
            </Reveal>

            <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {principles.map((p, i) => (
                <Reveal
                  as="li"
                  key={p}
                  delay={i * 60}
                  className="flex items-center gap-3 border-b border-[rgba(220,235,228,0.1)] py-3"
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
                  <span className="text-ivory">{p}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
