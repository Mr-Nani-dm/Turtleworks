/*
  Client work. Everything here must stay true and checkable — each site is
  linked so a visitor can open it. No invented metrics, no ranking claims.
  A `review` is added only when the client has approved that exact wording
  for publication; until then the slot stays empty rather than fabricated.
*/

export type ClientCase = {
  id: string;
  name: string;
  /** The live site, opened from the card. */
  url: string;
  /** Hostname shown as the visit label. */
  host: string;
  /** Screenshot in /public/work. */
  image: string;
  /** Short tag for the kind of work. */
  kind: string;
  /** One line: what it is and who it's for. */
  summary: string;
  /** What we built, in checkable terms. */
  built: string[];
  /** Only ever a real, client-approved quote. */
  review?: { quote: string; author: string };
};

export const clients: ClientCase[] = [
  {
    id: "tanvi-dental",
    name: "Tanvi Dental Care & Implant Centre",
    url: "https://www.tanvidental.in/",
    host: "tanvidental.in",
    image: "/work/tanvi-dental.jpg",
    kind: "Website · Local SEO & GEO",
    summary:
      "A dental clinic in Mangalagiri that needed nearby patients to find it and get in touch.",
    built: [
      "A fast, mobile-first website with doctor profiles, treatment guides and one-tap call and WhatsApp",
      "Local SEO and a Google Business Profile so it shows up for dental searches in Mangalagiri",
      "Structured data and a clear page per treatment, so Google and AI assistants can read it",
    ],
  },
  {
    id: "learnthinkbuild",
    name: "LearnThinkBuild",
    url: "https://learnthinkbuild.in/",
    host: "learnthinkbuild.in",
    image: "/work/learnthinkbuild.jpg",
    kind: "Custom software",
    summary:
      "A learner-session app for tutors, teaching staff and institutions to run live sessions.",
    built: [
      "A web app that turns a live class into assigned quizzes, follow-up Q&A and shared feedback",
      "Sign in with Google or email; students join a session with an invite code",
      "Built for a single tutor or a whole institution to run and manage sessions",
    ],
  },
];
