import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Plus } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { faqs } from "@/data/faq";

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="section-solid relative py-28 md:py-36"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-title" className="mt-5 text-h2">
              Straight answers.
            </h2>
            <p className="mt-6 max-w-sm text-[color:color-mix(in_srgb,var(--color-ivory)_76%,transparent)]">
              Something else on your mind? Ask it in your message — we&rsquo;d
              rather answer a real question than guess at one.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="border-t border-[rgba(220,235,228,0.12)]">
              {faqs.map((f) => (
                <details
                  key={f.question}
                  className="group border-b border-[rgba(220,235,228,0.12)]"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-6 text-left font-display text-lg text-ivory transition-colors hover:text-white md:text-xl [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <Plus
                      size={18}
                      className="shrink-0 text-amber transition-transform duration-300 ease-out group-open:rotate-45"
                    />
                  </summary>
                  <p className="max-w-[62ch] pb-7 leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)]">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
