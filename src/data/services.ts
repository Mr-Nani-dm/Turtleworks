/*
  What TurtleWorks offers, in plain words.
  Grouped by what the service does for the customer (not by our internal
  disciplines), so a visitor can find "the thing I need" in one scan.
  Every item renders in the static HTML — indexable and quotable.
*/

export type Service = {
  id: string;
  /** Plain-language name a customer would search for. */
  title: string;
  /** Compact label for inline lists (hero). */
  short: string;
  /** One sentence: what it does for the business, in everyday words. */
  plain: string;
  /** Concrete examples of what's included. */
  examples: string[];
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
        id: "websites",
        title: "Website design & development",
        short: "Websites",
        plain:
          "Fast, mobile-friendly websites that clearly explain what you do and make it easy for people to contact you.",
        examples: ["Business websites", "Landing pages", "Redesigns"],
      },
      {
        id: "seo-geo",
        title: "SEO, GEO & lead generation",
        short: "SEO & GEO",
        plain:
          "Get found on Google and in AI answers like ChatGPT and Gemini, then turn those visits into enquiries.",
        examples: ["Google search", "AI search (GEO)", "Lead capture"],
      },
      {
        id: "marketing",
        title: "Digital marketing",
        short: "Digital marketing",
        plain:
          "Campaigns on Google and social media, measured by the enquiries they bring, not just clicks and likes.",
        examples: ["Online campaigns", "Content plans", "Results tracking"],
      },
      {
        id: "brand",
        title: "Brand building & creative",
        short: "Branding",
        plain:
          "A logo and a consistent look across your social media posters and short videos, so people recognise you.",
        examples: ["Logo design", "Social media posters", "Short videos"],
      },
    ],
  },
  {
    id: "run",
    title: "Run your business with less effort",
    summary: "Automate the repetitive work and give your team simple tools built around how you operate.",
    services: [
      {
        id: "whatsapp",
        title: "WhatsApp automation",
        short: "WhatsApp automation",
        plain:
          "Instant automatic replies to common questions at any hour, with every enquiry logged and tracked so none slip through.",
        examples: ["Auto-replies", "Enquiry tracking", "Follow-up reminders"],
      },
      {
        id: "automation",
        title: "Business automation",
        short: "Automation",
        plain:
          "Reminders, invoices, form entries and follow-ups done automatically, so your team stops repeating the same tasks.",
        examples: ["Reminders", "Invoices", "Connected tools"],
      },
      {
        id: "software",
        title: "Custom software for your operations",
        short: "Custom software",
        plain:
          "Simple apps to manage bookings, orders, stock, staff or customers, built around the way your business already works.",
        examples: ["Booking systems", "Admin portals", "Internal tools"],
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
        title: "Business dashboards & tracking",
        short: "Dashboards",
        plain:
          "Your sales, leads and daily numbers on one easy screen, instead of scattered spreadsheets and guesswork.",
        examples: ["Sales & leads", "Operations", "Live tracking"],
      },
      {
        id: "finops",
        title: "Cloud cost (FinOps) dashboards",
        short: "FinOps",
        plain:
          "See where your cloud money goes, which team or project is using it, and where you can spend less.",
        examples: ["Azure costs", "Spend alerts", "Savings opportunities"],
      },
      {
        id: "consulting",
        title: "Business & technology consulting",
        short: "Consulting",
        plain:
          "Not sure what you need? We start by understanding the problem, then recommend only the right next step.",
        examples: ["Problem mapping", "Options & trade-offs", "Right-sized plan"],
      },
    ],
  },
];

/** Flat list, in display order. */
export const services: Service[] = serviceGroups.flatMap((g) => g.services);
