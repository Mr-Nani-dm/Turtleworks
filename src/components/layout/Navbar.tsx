"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { SectionLink } from "@/components/ui/SectionLink";
import { nav } from "@/data/site";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track whichever section crosses the middle of the viewport. All sections
  // are observed, so the underline clears over ones that aren't in the nav.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section[id]"));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));

    const onTop = () => {
      if (window.scrollY < window.innerHeight * 0.4) setActive(null);
    };
    window.addEventListener("scroll", onTop, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onTop);
    };
  }, []);

  // Mobile menu is modal: lock scroll, make the page behind it inert,
  // close on Escape and return focus to the toggle.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const behind = [
      document.querySelector("main"),
      document.querySelector("footer"),
      document.querySelector("[data-film-toggle]"),
    ].filter((el): el is Element => Boolean(el));
    behind.forEach((el) => el.setAttribute("inert", ""));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      behind.forEach((el) => el.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "glass"
          : "bg-gradient-to-b from-[rgba(5,9,8,0.82)] via-[rgba(5,9,8,0.5)] to-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav
        className="container-tw flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
        aria-label="Primary"
      >
        <SectionLink id="top" className="shrink-0" aria-label="TurtleWorks home">
          <Logo />
        </SectionLink>

        <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
          {nav.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <SectionLink
                  id={item.id}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative inline-flex min-h-11 items-center text-sm transition-colors hover:text-ivory ${
                    isActive ? "text-ivory" : "text-ivory-soft"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-2 h-px origin-left bg-amber transition-transform duration-500 ease-out ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </SectionLink>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <Button href="#contact" variant="ghost">
            Start a conversation
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(220,235,228,0.24)] active:opacity-80 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span aria-hidden className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 block h-[1.5px] w-5 bg-ivory transition-all duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-[1.5px] w-5 bg-ivory transition-all duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[1.5px] w-5 bg-ivory transition-all duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 -z-20 bg-black/50 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        id="mobile-menu"
        inert={!open}
        className={`glass fixed inset-x-0 top-0 -z-10 origin-top px-[var(--spacing-gutter)] pb-10 pt-[calc(var(--nav-h)+1.5rem)] transition-[transform,opacity] duration-300 lg:hidden ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1">
          {nav.map((item) => (
            <li key={item.id}>
              <SectionLink
                id={item.id}
                onNavigate={close}
                className="block border-b border-[rgba(220,235,228,0.08)] py-4 font-display text-2xl text-ivory active:opacity-70"
              >
                {item.label}
              </SectionLink>
            </li>
          ))}
        </ul>
        <SectionLink
          id="contact"
          onNavigate={close}
          className="mt-8 flex min-h-11 w-full items-center justify-center gap-2.5 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-abyss [text-shadow:none] active:opacity-85"
        >
          Start a conversation
        </SectionLink>
      </div>
    </header>
  );
}
