const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";

export const site = {
  name: "TurtleWorks",
  descriptor: "Business Solutions & Technology Partner",
  tagline: "Listen. Validate. Build With Purpose.",
  url: "https://turtleworks.in",
  email: contactEmail,
  description:
    "TurtleWorks is a business solutions and technology partner. We understand the problem first, then design the right mix of technology, automation, digital experience and business solutions around what you actually need.",
} as const;

export const nav = [
  { label: "Solutions", href: "#solutions" },
  { label: "How We Work", href: "#process" },
  { label: "Work", href: "#work" },
  { label: "Why Us", href: "#why" },
  { label: "Contact", href: "#contact" },
] as const;

export const principles = [
  "Practical over complicated",
  "Evidence over assumptions",
  "Right-sized solutions",
  "Built for maintainability",
  "Clear ownership",
  "Long-term thinking",
] as const;

export const heroVideo = {
  desktop:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/6c4e943f-2d6b-43ba-90a5-dba804fbda2c.mp4",
  mobile:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/e7c43a6f-c1ee-49d0-b2e4-b8d65ddc083f.mp4",
  poster: "/videos/poster.jpg",
  cdn: {
    master:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/4c06ec38-68d0-4389-8918-65bfa35d38be.mp4",
    desktop:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/6c4e943f-2d6b-43ba-90a5-dba804fbda2c.mp4",
    mobile:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3J3Jy12MCj1kWrV3GOvjalBNbgg/e7c43a6f-c1ee-49d0-b2e4-b8d65ddc083f.mp4",
  },
} as const;
