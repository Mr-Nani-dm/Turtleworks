export type WorkItem = {
  id: string;
  index: string;
  discipline: string;
  title: string;
  problem: string;
  approach: string;
  outcome: string;
  /** Placeholder flag — no real client work is published yet. */
  placeholder: boolean;
};

/*
  These are illustrative capability placeholders, NOT real client case studies.
  No customer names, metrics, logos or results are invented. Replace `placeholder`
  entries with approved case studies (problem / approach / outcome) when available.
*/
export const workItems: WorkItem[] = [
  {
    id: "operations-platform",
    index: "01",
    discipline: "Software · Automation",
    title: "Operations platform",
    problem:
      "A growing team ran core operations across spreadsheets and disconnected tools, with no single source of truth.",
    approach:
      "We mapped the actual workflow, then built a focused internal platform that consolidated the critical steps and automated hand-offs.",
    outcome:
      "One clear system of record, with manual re-entry removed from the highest-friction paths.",
    placeholder: true,
  },
  {
    id: "digital-experience",
    index: "02",
    discipline: "Digital Experience · SEO",
    title: "Customer-facing website",
    problem:
      "An established business needed a credible, accessible web presence that reflected the quality of its work.",
    approach:
      "A right-sized site with a clean content model, technical SEO foundations and a maintainable component system.",
    outcome:
      "A fast, accessible site the team can update confidently, built for the long term.",
    placeholder: true,
  },
  {
    id: "cloud-visibility",
    index: "03",
    discipline: "Cloud · Cost Visibility",
    title: "Cloud cost visibility",
    problem:
      "Cloud spend had grown opaque, and the people accountable for it lacked a clear view of where it went.",
    approach:
      "We introduced practical cost visibility and right-sizing, aligning infrastructure to the actual workload.",
    outcome:
      "Spend that is legible and reviewable, with a repeatable practice rather than a one-off cleanup.",
    placeholder: true,
  },
];
