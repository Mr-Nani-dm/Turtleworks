import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GoldMark } from "@/components/ui/GoldMark";
import { Logo } from "./Logo";
import { legalLinks, nav, sectionHref, site } from "@/data/site";

const linkClass =
  "text-sm text-ivory-soft underline-offset-4 transition-colors hover:text-ivory hover:underline";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-solid relative">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" aria-label="TurtleWorks home" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-5 max-w-xs text-sm text-sage">
              {site.descriptor}. Small steps can create meaningful progress.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Navigate</p>
            <ul className="mt-5 flex flex-col gap-3">
              {nav.map((item) => (
                <li key={item.id}>
                  <Link href={sectionHref(item.id)} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Get in touch</p>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <Link href={sectionHref("contact")} className={linkClass}>
                  Send an enquiry
                </Link>
              </li>
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
                  <Link href={l.href} className="underline-offset-4 transition-colors hover:text-ivory hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
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
