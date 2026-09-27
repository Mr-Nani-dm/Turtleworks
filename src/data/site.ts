/*
  Site-wide configuration. Anything that must be real (domain, inbox, booking
  link) comes from environment variables so production never ships a
  placeholder. Unset optional values simply hide the UI that depends on them.

  NEXT_PUBLIC_SITE_URL       canonical origin, e.g. https://turtleworks.co
  NEXT_PUBLIC_CONTACT_EMAIL  public inbox shown as a direct-email option
  NEXT_PUBLIC_BOOKING_URL    Cal.com / Calendly link for booking a call
*/

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const vercelProductionUrl = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);

export const site = {
  name: "TurtleWorks",
  descriptor: "Business Solutions & Technology Partner",
  tagline: "Listen. Validate. Build With Purpose.",
  url: (
    clean(process.env.NEXT_PUBLIC_SITE_URL) ??
    (vercelProductionUrl ? `https://${vercelProductionUrl}` : null) ??
    "https://turtleworks.vercel.app"
  ).replace(/\/+$/, ""),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  bookingUrl: clean(process.env.NEXT_PUBLIC_BOOKING_URL),
  description:
    "TurtleWorks is a business solutions and technology partner. We understand the problem first, then design the right mix of technology, automation, digital experience and business solutions around what you actually need.",
} as const;

export const nav = [
  { label: "Solutions", id: "solutions" },
  { label: "How We Work", id: "process" },
  { label: "Work", id: "work" },
  { label: "Why Us", id: "why" },
  { label: "Contact", id: "contact" },
] as const;

/** Links to a home-page section from any route. */
export const sectionHref = (id: string) => `/#${id}`;

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

export const principles = [
  "Practical over complicated",
  "Evidence over assumptions",
  "Right-sized solutions",
  "Built for maintainability",
  "Clear ownership",
  "Long-term thinking",
] as const;

/** Ambient film. WebM first (much smaller), MP4 for Safari/older browsers. */
export const heroVideo = {
  desktop: {
    webm: "/videos/turtle-desktop.webm",
    mp4: "/videos/turtle-desktop.mp4",
  },
  mobile: {
    webm: "/videos/turtle-mobile.webm",
    mp4: "/videos/turtle-mobile.mp4",
  },
  poster: "/videos/poster.jpg",
} as const;
