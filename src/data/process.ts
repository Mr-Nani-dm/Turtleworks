export type ProcessStep = {
  index: string;
  title: string;
  body: string;
};

export const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Understand",
    body: "We understand the business problem, environment and constraints before proposing anything.",
  },
  {
    index: "02",
    title: "Recommend",
    body: "We recommend only what is required — the smallest effective step, not the largest possible one.",
  },
  {
    index: "03",
    title: "Validate",
    body: "Where useful, we prove the direction through a prototype or pilot before committing to build.",
  },
  {
    index: "04",
    title: "Build",
    body: "We deliver against agreed outcomes and clear acceptance criteria, with ownership handed over.",
  },
  {
    index: "05",
    title: "Improve",
    body: "We measure what matters and improve over time — small steps, compounding into real progress.",
  },
];
