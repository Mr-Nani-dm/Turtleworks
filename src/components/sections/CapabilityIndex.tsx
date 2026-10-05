import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ServiceScene } from "@/components/sections/ServiceScene";
import { serviceGroups, type Service } from "@/data/services";

/*
  What we build: six services, two per outcome. Each tile leads with a small
  scene of the result, so a visitor understands it before reading a word.
  Desktop reads as a menu (one column per outcome); phones stack.
*/

function ServiceTile({ service }: { service: Service }) {
  return (
    <li className="svc-tile flex flex-col">
      <div className="svc-scene">
        <ServiceScene id={service.id} />
        <span className="svc-sheen" aria-hidden="true" />
      </div>
      <h4 className="mt-5 font-display text-lg font-semibold leading-snug text-ivory md:text-xl">
        <span className="svc-underline">{service.title}</span>
      </h4>
      <p className="mt-2 leading-relaxed text-ivory-soft">{service.plain}</p>
    </li>
  );
}

export function CapabilityIndex() {
  return (
    <section id="solutions" className="section-solid relative py-24 md:py-32">
      <Container>
        <Reveal>
          <h2 className="text-h2">
            What we build
            <br />
            <span className="text-mint">for your business.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-16 md:mt-16 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto] lg:gap-x-10 lg:gap-y-0">
          {serviceGroups.map((group, i) => (
            <div key={group.id} className="lg:row-span-3 lg:grid lg:grid-rows-subgrid">
              <div className="border-t border-[rgba(220,235,228,0.14)] pt-5">
                <span
                  aria-hidden="true"
                  className="font-display text-sm font-semibold tabular-nums tracking-[0.2em] text-gold"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  id={`svc-${group.id}`}
                  className="mt-2 font-display text-2xl font-semibold leading-tight text-balance text-ivory"
                >
                  {group.title}
                </h3>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-ivory-muted">
                  {group.summary}
                </p>
              </div>
              <ul
                aria-labelledby={`svc-${group.id}`}
                className="mt-7 grid gap-10 md:grid-cols-2 lg:row-span-2 lg:grid-cols-1 lg:grid-rows-subgrid lg:gap-y-12"
              >
                {group.services.map((service) => (
                  <ServiceTile key={service.id} service={service} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Reveal className="mt-16 flex flex-col gap-5 border-t border-[rgba(220,235,228,0.1)] pt-10 md:mt-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-lg text-ivory-soft">
              Not sure which of these you need? Tell us the problem. We will recommend only what fits.
            </p>
            <p className="mt-2 text-sm text-ivory-muted">
              The scenes are illustrative; &ldquo;Your Business&rdquo; stands in for yours.
            </p>
          </div>
          <Button href="#contact" variant="primary" className="self-start md:self-auto">
            Describe your problem
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
