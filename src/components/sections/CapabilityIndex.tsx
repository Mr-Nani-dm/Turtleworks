"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { services, type Service } from "@/data/services";

function ServiceDetail({ service, compact = false }: { service: Service; compact?: boolean }) {
  return (
    <>
      {compact ? null : (
        <>
          <span className="text-xs font-medium tabular-nums text-amber">{service.index}</span>
          <h3 className="mt-3 text-h3">{service.title}</h3>
          <p className="mt-2 text-sm text-mint">{service.summary}</p>
        </>
      )}
      <p className={`${compact ? "" : "mt-6"} leading-relaxed text-ivory-soft`}>{service.detail}</p>
      <ul className={`${compact ? "mt-4" : "mt-8"} flex flex-wrap gap-2`} aria-label="Typical outcomes">
        {service.outcomes.map((o) => (
          <li
            key={o}
            className="rounded-full border border-[rgba(220,235,228,0.16)] px-3.5 py-1.5 text-xs text-ivory-soft"
          >
            {o}
          </li>
        ))}
      </ul>
    </>
  );
}

/*
  Every service's full description is server-rendered (indexable, and readable
  without JS). Desktop: hover or select a row to show it in the sticky panel.
  Touch / narrow: the selected row expands inline, right where it was tapped.
*/
export function CapabilityIndex() {
  const [active, setActive] = useState(0);

  return (
    <section id="solutions" className="section-solid relative py-28 md:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div>
            <Reveal>
              <Eyebrow>What we do</Eyebrow>
              <h2 className="mt-5 text-h2">
                Different problems.
                <br />
                <span className="text-mint">The right solution.</span>
              </h2>
              <p className="mt-6 max-w-md text-ivory-soft">
                We start with the business need — not a predefined product.
              </p>
            </Reveal>

            <ul className="mt-12 border-t border-[rgba(220,235,228,0.1)]">
              {services.map((service, i) => {
                const isActive = i === active;
                return (
                  <li key={service.id} className="border-b border-[rgba(220,235,228,0.1)]">
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-expanded={isActive}
                      aria-controls={`svc-inline-${service.id} svc-panel-${service.id}`}
                      className="group flex min-h-11 w-full items-baseline gap-5 py-5 text-left transition-colors active:opacity-80"
                    >
                      <span
                        className={`text-xs font-medium tabular-nums transition-colors ${
                          isActive ? "text-amber" : "text-sage"
                        }`}
                      >
                        {service.index}
                      </span>
                      <span className="flex-1">
                        <span
                          className={`block font-display text-xl transition-colors md:text-2xl ${
                            isActive ? "text-ivory" : "text-ivory-muted group-hover:text-ivory"
                          }`}
                        >
                          {service.title}
                        </span>
                        <span className="mt-1 block text-sm text-ivory-muted lg:hidden">
                          {service.summary}
                        </span>
                      </span>
                    </button>
                    <div
                      id={`svc-inline-${service.id}`}
                      hidden={!isActive}
                      className="pb-6 pl-10 lg:hidden"
                    >
                      <ServiceDetail service={service} compact />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <div className="rounded-2xl border border-[rgba(220,235,228,0.12)] bg-[rgba(8,19,15,0.72)] p-10">
              {services.map((service, i) => (
                <div
                  key={service.id}
                  id={`svc-panel-${service.id}`}
                  hidden={i !== active}
                >
                  <ServiceDetail service={service} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
