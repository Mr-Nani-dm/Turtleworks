/*
  Site-wide configuration. Anything that must be real (domain, inbox, booking
  link) comes from environment variables so production never ships a
  placeholder. Unset optional values simply hide the UI that depends on them.

  NEXT_PUBLIC_SITE_URL       canonical origin, e.g. https://turtleworks.co
  NEXT_PUBLIC_CONTACT_EMAIL  public inbox shown as a direct-email option
  NEXT_PUBLIC_BOOKING_URL    Cal.com / Calendly link for booking a call
  NEXT_PUBLIC_LEGAL_NAME     registered / trading entity, e.g. "TurtleWorks Ltd"
  NEXT_PUBLIC_LOCATION       where you operate from, e.g. "Hyderabad, India"
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
    "https://turtleworks.in"
  ).replace(/\/+$/, ""),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ?? "hello@turtleworks.in",
  bookingUrl: clean(process.env.NEXT_PUBLIC_BOOKING_URL),
  legalName: clean(process.env.NEXT_PUBLIC_LEGAL_NAME),
  location: clean(process.env.NEXT_PUBLIC_LOCATION),
  description:
    "TurtleWorks is a business solutions and technology partner. We understand the problem first, then design the right mix of technology, automation, digital experience and business solutions around what you actually need.",
} as const;

export const nav = [
  { label: "Solutions", id: "solutions" },
  { label: "How We Work", id: "process" },
  { label: "Examples", id: "work" },
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

/*
  Cinematic film (revised cut: the turtle ends holding the viewer's gaze).
  WebM first (much smaller), MP4 for Safari/older browsers. Files are
  versioned by name so they can be cached long-term; a new cut = a new name.
  Desktop is encoded with a keyframe every 0.5s so scroll-scrubbing seeks
  smoothly. Source masters: the CloudFront originals in git history.
*/
export const heroVideo = {
  desktop: {
    webm: "/videos/turtle-desktop-v2.webm",
    mp4: "/videos/turtle-desktop-v2.mp4",
  },
  mobile: {
    webm: "/videos/turtle-mobile-v2.webm",
    mp4: "/videos/turtle-mobile-v2.mp4",
  },
  poster: "/videos/poster-v2.jpg",
} as const;
