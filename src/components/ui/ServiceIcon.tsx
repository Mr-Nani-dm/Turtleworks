import type { ReactNode } from "react";

/*
  Line icons for the ten services, keyed by Service.id.
  One consistent stroke weight and grid so the set reads as a family — a
  glanceable visual anchor per tile, not decoration. Inline SVG so it ships
  in the static HTML with no runtime cost.
*/
const glyphs: Record<string, ReactNode> = {
  websites: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9h18M6.5 6.75h.01M9 6.75h.01" />
    </>
  ),
  "seo-geo": (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  marketing: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  brand: <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />,
  whatsapp: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4z" />
      <path d="M8.5 9h7M8.5 12h4" />
    </>
  ),
  automation: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9M5 4v3h3" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9M19 20v-3h-3" />
    </>
  ),
  software: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  dashboards: (
    <>
      <path d="M5 20v-9M12 20V5M19 20v-6" />
      <path d="M3 20h18" />
    </>
  ),
  finops: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  consulting: (
    <>
      <path d="M9.5 18h5M10.5 21h3" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8.9.9 1.5l.1.7h5.2l.1-.7c.1-.6.4-1.1.9-1.5A6 6 0 0 0 12 3z" />
    </>
  ),
};

export function ServiceIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {glyphs[id] ?? glyphs.software}
    </svg>
  );
}
