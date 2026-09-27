"use client";

import { Container } from "@/components/ui/Container";
import { GoldMark } from "@/components/ui/GoldMark";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";

export function MoreToRight() {
  const { ref, visible } = useIntersectionReveal<HTMLDivElement>({
    threshold: 0.55,
    rootMargin: "0px 0px -8% 0px",
    once: true,
  });

  return (
    <section
      id="right-step"
      aria-labelledby="right-step-title"
      className="section-solid relative flex min-h-[62svh] items-center overflow-hidden py-24 md:min-h-[72svh] md:py-28"
    >
      <Container>
        <div
          ref={ref}
          className={"more-to-right mx-auto max-w-5xl text-center " + (visible ? "more-to-right--active" : "")}
        >
          <h2 id="right-step-title" className="sr-only">
            Not more. The right next step.
          </h2>

          <div className="more-to-right__motion" aria-hidden="true">
            <span className="more-to-right__word more-to-right__word--more">
              MORE
            </span>
            <span className="more-to-right__word more-to-right__word--right">
              RIGHT
            </span>
          </div>

          <div className="more-to-right__static" aria-hidden="true">
            <span>MORE</span>
            <span className="text-amber">→</span>
            <span>RIGHT</span>
          </div>

          <div className="more-to-right__copy mt-8 md:mt-10">
            <div className="flex justify-center">
              <GoldMark size={20} />
            </div>
            <p className="mt-5 font-display text-2xl font-medium tracking-[-0.02em] text-ivory md:text-3xl">
              Not more. <span className="text-mint">The right next step.</span>
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_64%,transparent)] md:text-base">
              We recommend only what earns its place.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
