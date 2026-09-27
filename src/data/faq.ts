export type Faq = { question: string; answer: string };

/*
  Answers restate TurtleWorks' stated process and principles only.
  Do not add commitments (response times, prices, guarantees) here unless the
  business has approved them.
*/
export const faqs: Faq[] = [
  {
    question: "Are you a software company or a consultancy?",
    answer:
      "Both, deliberately. We start with the business problem, then recommend the right mix — sometimes custom software, sometimes automation or an integration, sometimes a process change and no new system at all.",
  },
  {
    question: "How does an engagement usually start?",
    answer:
      "With a conversation about the problem. From there, a short discovery to understand your environment and constraints, followed by a clear recommendation before any build is committed.",
  },
  {
    question: "How do you price work?",
    answer:
      "Work is scoped after discovery, against agreed outcomes and acceptance criteria. We don't sell predefined packages, because the right solution depends on the problem.",
  },
  {
    question: "Will we own what you build?",
    answer:
      "Clear ownership is one of our principles. What we build for you is documented and handed over, and ownership terms are agreed in writing before work begins.",
  },
  {
    question: "Can you work with the systems we already have?",
    answer:
      "Yes — connecting what you already run is often the most useful place to start. We look for the smallest change that removes the most friction.",
  },
  {
    question: "Do you support things after launch?",
    answer:
      "Yes. Improvement is part of how we work: we measure what matters after launch and improve over time, rather than handing over and disappearing.",
  },
];
