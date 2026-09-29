import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "./ContactForm";
import { nextSteps } from "@/data/engagement";
import { site } from "@/data/site";
import { getDeliveryMode } from "@/lib/contact-delivery";

export function ContactCTA() {
  // Evaluated at build time for this static page. In production the form only
  // appears once a delivery channel is configured, so no enquiry is ever lost.
  const deliveryReady = getDeliveryMode() !== null;
  const showForm = deliveryReady || process.env.NODE_ENV !== "production";

  if (!deliveryReady && process.env.NODE_ENV === "production") {
    console.warn(
      "[contact] No delivery channel configured (CONTACT_WEBHOOK_URL or RESEND_API_KEY + CONTACT_TO_EMAIL). The enquiry form is hidden.",
    );
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="section-solid relative py-32 md:py-44"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Reveal>
              <h2 id="contact-title" className="text-h1 font-semibold">
                Have a problem worth solving?
              </h2>
              <p className="mt-5 text-xl text-ivory-soft">
                Let&rsquo;s understand it first.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <h3 className="eyebrow mt-12">
                What happens next
              </h3>
              <ol className="mt-5 space-y-5">
                {nextSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(197,138,46,0.55)] text-xs font-medium tabular-nums text-gold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-ivory">{step.title}</p>
                      <p className="mt-1 text-[0.9375rem] leading-relaxed text-ivory-soft">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            {site.bookingUrl || site.email ? (
              <Reveal delay={160}>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {site.bookingUrl ? (
                    <Button href={site.bookingUrl} variant="ghost" external>
                      Book a call instead
                    </Button>
                  ) : null}
                  {site.email ? (
                    <a
                      href={`mailto:${site.email}`}
                      className="min-h-11 break-all py-3 text-sm text-mint underline-offset-4 hover:underline"
                    >
                      {site.email}
                    </a>
                  ) : null}
                </div>
              </Reveal>
            ) : null}
          </div>

          <Reveal delay={120}>
            {showForm ? (
              <ContactForm email={site.email} bookingUrl={site.bookingUrl} />
            ) : (
              <div className="rounded-2xl border border-[rgba(220,235,228,0.14)] bg-[rgba(8,19,15,0.55)] p-8 backdrop-blur-sm md:p-10">
                <h3 className="font-display text-2xl text-ivory">
                  Online enquiries open shortly.
                </h3>
                <p className="mt-3 leading-relaxed text-ivory-soft">
                  {site.bookingUrl || site.email
                    ? "In the meantime, please use the options alongside to reach us."
                    : "Please check back soon."}
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
