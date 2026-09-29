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
    <li className="flex flex-col">
      <ServiceScene id={service.id} />
      <h4 className="mt-5 font-display text-lg font-semibold leading-snug text-ivory md:text-xl">
        {service.title}
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

        <div className="mt-14 grid gap-16 md:mt-16 lg:grid-cols-3 lg:gap-10">
          {serviceGroups.map((group) => (
            <div key={group.id}>
              <h3
                id={`svc-${group.id}`}
                className="border-t border-[rgba(220,235,228,0.14)] pt-5 font-display text-2xl font-semibold leading-tight text-ivory"
              >
                {group.title}
              </h3>
              <ul
                aria-labelledby={`svc-${group.id}`}
                className="mt-7 grid gap-10 md:grid-cols-2 lg:grid-cols-1 lg:gap-12"
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
