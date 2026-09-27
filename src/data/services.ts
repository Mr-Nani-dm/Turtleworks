export type Service = {
  id: string;
  index: string;
  title: string;
  summary: string;
  detail: string;
  outcomes: string[];
};

export const services: Service[] = [
  {
    id: "consulting",
    index: "01",
    title: "Business & Technology Consulting",
    summary: "Understand the problem before naming a solution.",
    detail:
      "We map the business need, the environment and the constraints, then advise on the smallest change that moves things forward — no predefined product, no unnecessary scope.",
    outcomes: ["Problem framing", "Options & trade-offs", "Right-sized roadmap"],
  },
  {
    id: "software",
    index: "02",
    title: "Custom Software & Web Solutions",
    summary: "Practical systems built to be maintained.",
    detail:
      "Web platforms, internal tools and custom applications delivered against agreed outcomes and acceptance criteria — built for clarity, ownership and long-term maintainability.",
    outcomes: ["Web & app platforms", "Internal tooling", "Clean handover"],
  },
  {
    id: "automation",
    index: "03",
    title: "Automation & Systems Integration",
    summary: "Connect what you already run.",
    detail:
      "We remove repetitive work and stitch existing systems together so data flows reliably — automating the steps that are genuinely worth automating.",
    outcomes: ["Workflow automation", "System integration", "Data pipelines"],
  },
  {
    id: "experience",
    index: "04",
    title: "Digital Experience",
    summary: "Interfaces people trust and understand.",
    detail:
      "Considered UX and interface design that respects attention and communicates clearly — accessible, fast and consistent across every screen.",
    outcomes: ["UX & UI design", "Design systems", "Accessibility"],
  },
  {
    id: "growth",
    index: "05",
    title: "Search & Digital Growth",
    summary: "Visibility where it makes sense.",
    detail:
      "Technical SEO, structured content and measured digital marketing — applied where there is a real audience to reach, not as a default add-on.",
    outcomes: ["Technical SEO", "Structured content", "Measured campaigns"],
  },
  {
    id: "cloud",
    index: "06",
    title: "Cloud & Cost Visibility",
    summary: "Right-sized cloud, clear spend.",
    detail:
      "Azure and cloud-focused solutions with practical cost visibility — so infrastructure fits the workload and spend stays legible to the people accountable for it.",
    outcomes: ["Azure & cloud", "Cost visibility", "FinOps practices"],
  },
];
