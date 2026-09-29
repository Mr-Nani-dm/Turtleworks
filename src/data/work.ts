/*
  Proof: systems TurtleWorks built and runs for itself. Everything here must
  stay true and checkable. Lighthouse scores are measured on the production
  build (mobile and desktop, same run date); re-measure and update the date
  whenever they are republished. Add client case studies only with approval.
*/

export const lighthouse = {
  measured: "September 2026",
  mobile: { performance: 93, accessibility: 100, bestPractices: 100, seo: 100 },
  desktop: { performance: 100, accessibility: 100, bestPractices: 100, seo: 100 },
};

export type ProofItem = {
  id: "website" | "enquiries";
  title: string;
  body: string;
  facts: string[];
};

export const proof: ProofItem[] = [
  {
    id: "website",
    title: "This website",
    body: "Built to load fast on Indian mobile networks, to be read by search engines and AI assistants, and to hand every enquiry straight to our automations.",
    facts: [
      "Scored by Google Lighthouse on mobile and desktop",
      "A plain-language summary for AI assistants at /llms.txt, plus structured data",
      "Works with a keyboard and screen readers, and respects reduced motion",
    ],
  },
  {
    id: "enquiries",
    title: "Our enquiry system",
    body: "Every enquiry sent through this site runs through the same kind of automation we build for clients. It runs every day, unattended.",
    facts: [
      "Logged the moment it arrives, with an instant confirmation to the sender",
      "AI suggests the right service, flags spam and drafts a reply; a person checks it before it goes",
      "Reminders if an enquiry waits too long, and follow-ups on proposals and invoices",
      "A weekly lead summary, a monthly report with visitor numbers, and the site checked every hour",
    ],
  },
];
