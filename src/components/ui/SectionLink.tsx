"use client";

import { AnchorHTMLAttributes, ReactNode } from "react";

type SectionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  id: string;
  children: ReactNode;
  /** Runs before focus moves, e.g. to close a menu. */
  onNavigate?: () => void;
};

/** Moves focus to the section so keyboard and screen-reader users land there too. */
export function focusSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/**
 * In-page link for the home page. A native anchor (so the browser scrolls and
 * the URL hash updates) that also moves focus to the target section.
 */
export function SectionLink({ id, onNavigate, onClick, children, ...rest }: SectionLinkProps) {
  return (
    <a
      href={`#${id}`}
      onClick={(event) => {
        onClick?.(event);
        onNavigate?.();
        // After the browser handles the hash (scroll + URL), move focus.
        setTimeout(() => focusSection(id), 0);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
