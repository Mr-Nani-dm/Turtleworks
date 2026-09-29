export type ProcessStep = {
  title: string;
  body: string;
  youGet: string;
};

/*
  Three stages; each stands on its own. No durations or prices are stated:
  those are scoped per engagement and must not be implied here.
*/
export const processSteps: ProcessStep[] = [
  {
    title: "Understand",
    body: "A conversation and a short discovery: your problem, your setup and your limits. Nothing is built yet.",
    youGet: "A clear recommendation of only what's needed.",
  },
  {
    title: "Build",
    body: "We build what we agreed, against clear outcomes, and prove it with a small pilot first where that helps.",
    youGet: "A working solution, documented and handed over.",
  },
  {
    title: "Improve",
    body: "After launch we measure what matters and improve in small, deliberate steps.",
    youGet: "Steady progress without starting again.",
  },
];
