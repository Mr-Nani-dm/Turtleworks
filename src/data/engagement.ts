export type EngagementModel = {
  name: string;
  purpose: string;
  youGet: string;
};

/*
  Engagement shapes derived from the Understand → Recommend → Validate →
  Build → Improve process. No durations or prices are stated: those are
  scoped per engagement and must not be implied here.
*/
export const engagementModels: EngagementModel[] = [
  {
    name: "Discovery",
    purpose:
      "Understand the problem, the environment and the constraints before anything is built.",
    youGet: "A clear recommendation — only what is actually needed.",
  },
  {
    name: "Delivery",
    purpose:
      "Build the agreed solution against defined outcomes and acceptance criteria, validated first where useful.",
    youGet: "A working solution, documented and handed over.",
  },
  {
    name: "Ongoing improvement",
    purpose:
      "Measure what matters after launch and improve in small, deliberate steps.",
    youGet: "Steady progress without re-starting from scratch.",
  },
];

export const nextSteps = [
  {
    title: "Tell us about the problem",
    body: "A few lines is enough. No brief or specification needed.",
  },
  {
    title: "We reply personally",
    body: "To arrange a conversation about your situation — not a sales sequence.",
  },
  {
    title: "We agree the right first step",
    body: "Sometimes that's a short discovery, sometimes something smaller. Nothing is committed until you've agreed what it involves.",
  },
] as const;
