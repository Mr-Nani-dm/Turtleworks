"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { nav } from "@/data/site";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500 " +
        (scrolled || open ? "glass" : "bg-transparent")
      }
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <nav
        className="container-tw flex items-center justify-between"
        style={{ height: "var(--nav-h)" }}
        aria-label="Primary"
      >
        <a href="#top" className="shrink-0" aria-label="TurtleWorks home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-7 lg:flex xl:gap-9">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)] transition-colors hover:text-ivory"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button href="#contact" variant="ghost">
            Start a conversation
          </Button>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(220,235,228,0.18)] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-3.5 w-5">
            <span
              className={
                "absolute left-0 block h-[1.5px] w-5 bg-ivory transition-all duration-300 " +
                (open ? "top-1.5 rotate-45" : "top-0")
              }
            />
            <span
              className={
                "absolute left-0 top-1.5 block h-[1.5px] w-5 bg-ivory transition-all duration-300 " +
                (open ? "opacity-0" : "opacity-100")
              }
            />
            <span
              className={
                "absolute left-0 block h-[1.5px] w-5 bg-ivory transition-all duration-300 " +
                (open ? "top-1.5 -rotate-45" : "top-3")
              }
            />
          </span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        inert={!open}
        aria-hidden={!open}
        className={
          "glass fixed inset-x-0 top-0 -z-10 origin-top px-[var(--spacing-gutter)] pb-10 pt-[calc(var(--nav-h)+1.5rem)] transition-[transform,opacity] duration-400 lg:hidden " +
          (open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-4 opacity-0")
        }
      >
        <ul className="flex flex-col gap-1">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border-b border-[rgba(220,235,228,0.08)] py-4 font-display text-2xl text-ivory"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Button href="#contact" variant="primary" className="w-full justify-center">
            Start a conversation
          </Button>
        </div>
      </div>
    </header>
  );
}
