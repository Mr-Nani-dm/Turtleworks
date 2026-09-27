import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Plus } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { faqs } from "@/data/faq";
import { jsonLd } from "@/lib/seo";

export function Faq() {
  const faqSchema = {
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
      className="section-solid relative py-24 md:py-28"
    >
      <Container>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-title" className="mt-5 text-h2">
              Straight answers.
            </h2>
          </Reveal>

          <Reveal delay={80} className="mt-12">
            <div className="border-t border-[rgba(220,235,228,0.12)]">
              {faqs.map((f) => (
                <details
                  key={f.question}
                  className="group border-b border-[rgba(220,235,228,0.12)]"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-6 text-left font-display text-lg text-ivory-soft transition-colors hover:text-ivory active:opacity-80 group-open:text-ivory md:text-xl [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <Plus
                      size={18}
                      className="shrink-0 text-amber transition-transform duration-300 ease-out group-open:rotate-45"
                    />
                  </summary>
                  <p className="max-w-[62ch] pb-7 leading-relaxed text-ivory-soft">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-ivory-muted">
              Something else on your mind? Ask it in your message — we&rsquo;d
              rather answer a real question than guess at one.
            </p>
          </Reveal>
        </div>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
    </section>
  );
}
