import Link from "next/link";
import { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { GoldMark } from "@/components/ui/GoldMark";
import { SectionLink } from "@/components/ui/SectionLink";
import { FilmToggle } from "@/components/motion/CinematicBackground";
import { Logo } from "./Logo";
import { legalLinks, nav, sectionHref, site } from "@/data/site";

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-ivory-soft underline-offset-4 transition-colors hover:text-ivory hover:underline sm:min-h-0";

type FooterProps = {
  /** On the home page, section links scroll in place and move focus. */
  onHome?: boolean;
};

export function Footer({ onHome = false }: FooterProps) {
  const year = new Date().getFullYear();

  const toSection = (id: string, children: ReactNode, className = linkClass) =>
    onHome ? (
      <SectionLink id={id} className={className}>
        {children}
      </SectionLink>
    ) : (
      <Link href={sectionHref(id)} className={className}>
        {children}
      </Link>
    );

  return (
    <footer className="section-solid relative">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="sm:col-span-2 md:col-span-1">
            {onHome ? (
              <SectionLink id="top" aria-label="TurtleWorks home" className="inline-block">
                <Logo />
              </SectionLink>
            ) : (
              <Link href="/" aria-label="TurtleWorks home" className="inline-block">
                <Logo />
              </Link>
            )}
            <p className="mt-5 max-w-xs text-sm text-sage">
              {site.descriptor}. Small steps can create meaningful progress.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Navigate</p>
            <ul className="mt-5 flex flex-col gap-1 sm:gap-3">
              {nav.map((item) => (
                <li key={item.id}>{toSection(item.id, item.label)}</li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Get in touch</p>
            <ul className="mt-5 flex flex-col gap-1 sm:gap-3">
              <li>{toSection("contact", "Send an enquiry")}</li>
              {site.whatsappUrl ? (
                <li>
                  <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ) : null}
              {site.bookingUrl ? (
                <li>
                  <a href={site.bookingUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Book a call<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ) : null}
              {site.email ? (
                <li>
                  <a href={`mailto:${site.email}`} className={`${linkClass} break-all`}>
                    {site.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[rgba(220,235,228,0.1)] pt-6 text-xs text-sage sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>
              &copy; {year} {site.legalName ?? site.name}. All rights reserved.
              {site.location ? <> Based in {site.location}.</> : null}
            </p>
            <ul className="flex items-center gap-5">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-ivory hover:underline sm:min-h-0"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {onHome ? <FilmToggle /> : null}
          </div>
          <p className="flex items-center gap-2 text-sage">
            <GoldMark size={16} />
            {site.tagline}
          </p>
        </div>
      </Container>
    </footer>
  );
}
