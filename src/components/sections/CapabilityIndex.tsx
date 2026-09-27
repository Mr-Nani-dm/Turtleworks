"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { services } from "@/data/services";

export function CapabilityIndex() {
  const [active, setActive] = useState(0);
  const current = services[active];

  return (
    <section id="solutions" className="section-solid relative py-28 md:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          {/* Left: intro + index */}
          <div>
            <Reveal>
              <Eyebrow>What we do</Eyebrow>
              <h2 className="mt-5 text-h2">
                Different problems.
                <br />
                <span className="text-mint">The right solution.</span>
              </h2>
              <p className="mt-6 max-w-md text-[color:color-mix(in_srgb,var(--color-ivory)_72%,transparent)]">
                We start with the business need — not a predefined product — and
                recommend only what genuinely moves things forward.
              </p>
            </Reveal>

            <ul className="mt-12 border-t border-[rgba(220,235,228,0.1)]">
              {services.map((service, i) => {
                const isActive = i === active;
                return (
                  <li key={service.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-pressed={isActive}
                      className="group flex w-full items-baseline gap-5 border-b border-[rgba(220,235,228,0.1)] py-5 text-left transition-colors"
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
                            isActive
                              ? "text-ivory"
                              : "text-[color:color-mix(in_srgb,var(--color-ivory)_58%,transparent)] group-hover:text-ivory"
                          }`}
                        >
                          {service.title}
                        </span>
                        {/* Inline summary keeps the offering self-explanatory on
                            touch, where the hover detail panel isn't available. */}
                        <span className="mt-1 block text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_60%,transparent)] lg:hidden">
                          {service.summary}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: detail panel */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="glass rounded-2xl p-8 md:p-10">
              <span className="text-xs font-medium tabular-nums text-amber">{current.index}</span>
              <h3 className="mt-3 text-h3">{current.title}</h3>
              <p className="mt-2 text-sm text-mint">{current.summary}</p>
              <p className="mt-6 leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_78%,transparent)]">
                {current.detail}
              </p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {current.outcomes.map((o) => (
                  <li
                    key={o}
                    className="rounded-full border border-[rgba(220,235,228,0.14)] px-3.5 py-1.5 text-xs text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)]"
                  >
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
