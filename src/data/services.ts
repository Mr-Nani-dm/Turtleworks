/*
  What TurtleWorks offers: six services, two per outcome, each named by what
  the customer gets rather than by our discipline. Nothing was dropped when
  we went from ten to six; the discipline names live in `includes`, which
  feeds structured data and /llms.txt so search and AI answers still match
  "SEO", "FinOps", "branding" and the rest.
*/

export type Service = {
  id: string;
  /** What the customer gets, in their words. */
  title: string;
  /** One sentence: what it does for the business. */
  plain: string;
  /** The disciplines and deliverables folded into this service. */
  includes: string[];
};

export type ServiceGroup = {
  id: string;
  title: string;
  summary: string;
  services: Service[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: "grow",
    title: "Get found and win customers",
    summary: "Your website, search and marketing working together to bring in real enquiries.",
    services: [
      {
        id: "website",
        title: "A website that brings enquiries",
        plain:
          "A fast, mobile-friendly website with your logo and look, built so visitors call or WhatsApp you.",
        includes: ["Website design & development", "Logo & branding", "Landing pages", "Redesigns"],
      },
      {
        id: "get-found",
        title: "Get found on Google, AI and social",
        plain:
          "Show up when people nearby search on Google, Maps or ChatGPT, with ads and posts measured by enquiries, not likes.",
        includes: [
          "SEO",
          "GEO (AI search)",
          "Google Business Profile",
          "Digital marketing",
          "Social media posters & short videos",
          "Lead generation",
        ],
      },
    ],
  },
  {
    id: "run",
    title: "Run your business with less effort",
    summary: "Automate the repetitive work and give your team simple tools built around how you operate.",
    services: [
      {
        id: "automation",
        title: "WhatsApp and admin that run themselves",
        plain:
          "Instant WhatsApp replies at any hour, plus reminders, invoices and follow-ups sent automatically.",
        includes: [
          "WhatsApp automation",
          "Auto-replies",
          "Enquiry tracking",
          "Reminders & invoices",
          "Business process automation",
        ],
      },
      {
        id: "software",
        title: "An app built for how you work",
        plain:
          "A simple app for bookings, orders, stock or staff, instead of notebooks and spreadsheets.",
        includes: ["Custom software", "Booking systems", "Admin portals", "Internal tools"],
      },
    ],
  },
  {
    id: "see",
    title: "See clearly and decide faster",
    summary: "The numbers that matter in one place, and advice on the right next step.",
    services: [
      {
        id: "dashboards",
        title: "Your numbers on one screen",
        plain:
          "Sales, leads and costs, including cloud and software bills, on one live screen instead of scattered sheets.",
        includes: [
          "Business dashboards",
          "Sales & lead tracking",
          "Cloud cost (FinOps) dashboards",
          "Spend alerts",
        ],
      },
      {
        id: "plan",
        title: "A clear plan before you spend",
        plain:
          "We map the problem and give you a one-page plan: what to fix first, what it will take, and what to skip.",
        includes: ["Business & technology consulting", "Problem mapping", "Right-sized plan"],
      },
    ],
  },
];

/** Flat list, in display order. */
export const services: Service[] = serviceGroups.flatMap((g) => g.services);
