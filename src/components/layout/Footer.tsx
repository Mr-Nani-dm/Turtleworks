import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { nav, site } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-solid relative">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_64%,transparent)]">
              {site.descriptor}. Small steps can create meaningful progress.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Navigate</p>
            <ul className="mt-5 flex flex-col gap-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_78%,transparent)] hover:text-ivory"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Contact</p>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_78%,transparent)] hover:text-ivory"
                >
                  {site.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[rgba(220,235,228,0.1)] pt-6 text-xs text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <p className="text-[color:color-mix(in_srgb,var(--color-mint)_60%,transparent)]">
            {site.tagline}
          </p>
        </div>
      </Container>
    </footer>
  );
}
