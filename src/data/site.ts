/*
  Site-wide configuration. Anything that must be real (domain, inbox, booking
  link) comes from environment variables so production never ships a
  placeholder. Unset optional values simply hide the UI that depends on them.

  NEXT_PUBLIC_SITE_URL       canonical origin, e.g. https://turtleworks.co
  NEXT_PUBLIC_CONTACT_EMAIL  public inbox shown as a direct-email option
  NEXT_PUBLIC_BOOKING_URL    https booking page (Google Calendar, Cal.com, Calendly)
  NEXT_PUBLIC_LEGAL_NAME     registered / trading entity, e.g. "TurtleWorks Ltd"
  NEXT_PUBLIC_LOCATION       where you operate from, e.g. "Hyderabad, India"
*/

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const httpsUrl = (value: string | undefined) => {
  const url = clean(value);
  return url && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
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
  bookingUrl: httpsUrl(process.env.NEXT_PUBLIC_BOOKING_URL),
  legalName: clean(process.env.NEXT_PUBLIC_LEGAL_NAME),
  location: clean(process.env.NEXT_PUBLIC_LOCATION),
  description:
    "TurtleWorks builds websites, SEO & GEO, WhatsApp and business automation, dashboards and custom software. We start with your problem and recommend only what fits.",
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
  /** Landscape phones: short, wide screens keep the 16:9 cut. */
  mobile: {
    webm: "/videos/turtle-mobile-v2.webm",
    mp4: "/videos/turtle-mobile-v2.mp4",
  },
  /**
   * Portrait phones: a 608×1080 cut from the 1080p master whose crop pans
   * with the turtle, so its head and shell stay in frame. A centre crop of
   * the 16:9 film showed mostly empty water on a tall screen.
   */
  mobilePortrait: {
    webm: "/videos/turtle-mobile-portrait-v3.webm",
    mp4: "/videos/turtle-mobile-portrait-v3.mp4",
  },
  poster: "/videos/poster-v2.jpg",
  posterWebp: "/videos/poster-v2.webp",
  /** Still from the portrait cut: shown on phones before the film loads or when autoplay is blocked (e.g. iOS Low Power Mode). */
  posterMobile: "/videos/poster-mobile-v3.jpg",
  posterMobileWebp: "/videos/poster-mobile-v3.webp",
} as const;
