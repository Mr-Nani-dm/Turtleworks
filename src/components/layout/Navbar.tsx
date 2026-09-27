"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { nav, sectionHref } from "@/data/site";

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

  // Highlight the section currently crossing the middle of the viewport.
  useEffect(() => {
    const sections = nav
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
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

  // Mobile menu: lock scroll, close on Escape, return focus to the toggle.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "glass" : "bg-transparent"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav
        className="container-tw flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
        aria-label="Primary"
      >
        <Link href="/#top" className="shrink-0" aria-label="TurtleWorks home">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
          {nav.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={sectionHref(item.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={`relative py-2 text-sm transition-colors hover:text-ivory ${
                    isActive
                      ? "text-ivory"
                      : "text-[color:color-mix(in_srgb,var(--color-ivory)_78%,transparent)]"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-amber transition-transform duration-500 ease-out ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <Button href={sectionHref("contact")} variant="ghost">
            Start a conversation
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(220,235,228,0.18)] lg:hidden"
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
        id="mobile-menu"
        inert={!open}
        className={`glass fixed inset-x-0 top-0 -z-10 origin-top px-[var(--spacing-gutter)] pb-10 pt-[calc(var(--nav-h)+1.5rem)] transition-[transform,opacity] duration-300 lg:hidden ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1">
          {nav.map((item) => (
            <li key={item.id}>
              <Link
                href={sectionHref(item.id)}
                onClick={() => setOpen(false)}
                className="block border-b border-[rgba(220,235,228,0.08)] py-4 font-display text-2xl text-ivory"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8" onClick={() => setOpen(false)}>
          <Button href={sectionHref("contact")} variant="primary" className="w-full justify-center">
            Start a conversation
          </Button>
        </div>
      </div>
    </header>
  );
}
