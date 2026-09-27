export const site = {
  name: "TurtleWorks",
  descriptor: "Business Solutions & Technology Partner",
  tagline: "Listen. Validate. Build With Purpose.",
  url: "https://turtleworks.example",
  email: "hello@turtleworks.example",
  description:
    "TurtleWorks is a business solutions and technology partner. We understand the problem first, then design the right mix of technology, automation, digital experience and business solutions around what you actually need.",
} as const;

export const nav = [
  { label: "Solutions", href: "#solutions" },
  { label: "How We Work", href: "#process" },
  { label: "Work", href: "#work" },
  { label: "Why", href: "#why" },
] as const;

export const principles = [
  "Practical over complicated",
  "Evidence over assumptions",
  "Right-sized solutions",
  "Built for maintainability",
  "Clear ownership",
  "Long-term thinking",
] as const;

/** Cinematic hero sources. Self-hosted in /public with CDN originals noted. */
export const heroVideo = {
  desktop: "/videos/turtle-desktop.mp4",
  mobile: "/videos/turtle-mobile.mp4",
  poster: "/videos/poster.jpg",
  cdn: {
    desktop:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/9e1443e2-6667-49b6-8521-1c9d0dba6fee.mp4",
    mobile:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/9aaf1bd0-5d1c-4b0d-bd20-771ac31f9c77.mp4",
  },
} as const;
