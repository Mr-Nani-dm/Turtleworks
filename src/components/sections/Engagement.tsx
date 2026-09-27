import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { engagementModels } from "@/data/engagement";

export function Engagement() {
  return (
    <section
      id="engage"
      aria-labelledby="engage-title"
      className="section-solid relative py-28 md:py-36"
    >
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>How we engage</Eyebrow>
          <h2 id="engage-title" className="mt-5 text-h2">
            Start small. Commit when it&rsquo;s clear.
          </h2>
          <p className="mt-6 text-ivory-soft">
            Each stage stands on its own. You can stop after discovery with a
            clear recommendation, or carry on into delivery and improvement.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
            {engagementModels.map((model, i) => (
              <li key={model.name}>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-px w-10 bg-amber" />
                  <span className="text-xs font-medium tabular-nums text-amber">
                    Stage {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl text-ivory">{model.name}</h3>
                <p className="mt-3 leading-relaxed text-ivory-soft">{model.purpose}</p>
                <p className="mt-4 text-sm text-mint">
                  <span className="text-sage">You get: </span>
                  {model.youGet}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-16 flex flex-col gap-4 border-t border-[rgba(220,235,228,0.12)] pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ivory-soft">
              Not sure which of these you need? That&rsquo;s what the first
              conversation is for.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="/#faq"
                className="inline-flex min-h-11 items-center text-sm text-ivory-muted underline-offset-4 transition-colors hover:text-ivory hover:underline"
              >
                How pricing works
              </Link>
              <Link
                href="/#contact"
                className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ivory underline decoration-[color-mix(in_srgb,var(--color-amber)_70%,transparent)] underline-offset-4 active:opacity-80"
              >
                Describe your problem
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
