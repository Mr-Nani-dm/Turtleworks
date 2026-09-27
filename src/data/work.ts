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
  Illustrative engagement shapes, NOT real client case studies. They are
  written as "how we'd approach it", never as past delivery. No customer names,
  metrics, logos or results. Replace with approved case studies (and set
  placeholder: false) when available — then past tense is appropriate.
*/
export const workItems: WorkItem[] = [
  {
    id: "operations-platform",
    index: "01",
    discipline: "Software · Automation",
    title: "Operations spread across spreadsheets",
    problem:
      "A growing team runs core operations across spreadsheets and disconnected tools, with no single source of truth.",
    approach:
      "Map the real workflow first, then consolidate the critical steps into one focused internal tool and automate the hand-offs.",
    outcome:
      "One clear system of record, with manual re-entry removed from the highest-friction steps.",
    placeholder: true,
  },
  {
    id: "digital-experience",
    index: "02",
    discipline: "Digital Experience · SEO",
    title: "A website that undersells the business",
    problem:
      "An established business has a web presence that doesn't reflect the quality of its work or help buyers understand it.",
    approach:
      "A right-sized site with a clear content model, technical SEO foundations and components the team can maintain.",
    outcome:
      "A fast, accessible site the team can update confidently, built for the long term.",
    placeholder: true,
  },
  {
    id: "cloud-visibility",
    index: "03",
    discipline: "Cloud · Cost Visibility",
    title: "Cloud spend nobody can explain",
    problem:
      "Cloud costs have grown opaque, and the people accountable for them lack a clear view of where the money goes.",
    approach:
      "Introduce practical cost visibility first, then right-size infrastructure to the actual workload.",
    outcome:
      "Spend that is legible and reviewable, with a repeatable practice rather than a one-off cleanup.",
    placeholder: true,
  },
];
