import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { serviceGroups, type Service } from "@/data/services";

/*
  "What we do", in plain words.
  Every service is visible at once (no tabs or accordions): a visitor should
  find "the thing I need" in one scan, on a phone as well as a laptop, and
  search engines / AI answers get the full list in the static HTML.
  Grouped by the outcome for the customer: get found → run smoothly → see clearly.
*/

function ServiceCard({ service }: { service: Service }) {
  return (
    <li className="flex flex-col rounded-2xl border border-[rgba(220,235,228,0.12)] bg-[rgba(8,19,15,0.72)] p-6 md:p-7">
      <h4 className="flex items-start gap-3 font-display text-lg font-semibold leading-snug text-ivory md:text-xl">
        <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
        {service.title}
      </h4>
      <p className="mt-3 leading-relaxed text-ivory-soft">{service.plain}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${service.title}: examples`}>
        {service.examples.map((e) => (
          <li
            key={e}
            className="whitespace-nowrap rounded-full border border-[rgba(220,235,228,0.16)] px-3 py-1 text-xs text-ivory-soft"
          >
            {e}
          </li>
        ))}
      </ul>
    </li>
  );
}

export function CapabilityIndex() {
  return (
    <section id="solutions" className="section-solid relative py-24 md:py-36">
      <Container>
        <Reveal>
          <Eyebrow>What we do</Eyebrow>
          <h2 className="mt-5 text-h2">
            Different problems.
            <br />
            <span className="text-mint">The right solution.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory-soft">
            Websites, search, marketing, branding, WhatsApp and business automation, custom
            software and dashboards. Here is what each one does for your business, in plain words.
          </p>
        </Reveal>

        <div className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-20">
          {serviceGroups.map((group) => (
            <div
              key={group.id}
              className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] lg:gap-14"
            >
              <Reveal className="lg:sticky lg:top-28 lg:self-start">
                <h3 id={`svc-${group.id}`} className="text-h3">
                  {group.title}
                </h3>
                <p className="mt-3 max-w-sm text-ivory-muted">{group.summary}</p>
              </Reveal>

              <ul
                aria-labelledby={`svc-${group.id}`}
                className="grid gap-4 sm:grid-cols-2 md:gap-5"
              >
                {group.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Reveal className="mt-16 flex flex-col gap-5 border-t border-[rgba(220,235,228,0.1)] pt-10 md:mt-20 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-lg text-ivory-soft">
            Not sure which of these you need? Tell us the problem. We will recommend only what fits.
          </p>
          <Button href="#contact" variant="primary" className="self-start md:self-auto">
            Describe your problem
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
