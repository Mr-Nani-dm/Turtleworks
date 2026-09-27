import type { Metadata } from "next";
import { site } from "@/data/site";

const title = `${site.name} — ${site.descriptor}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "business solutions",
    "technology partner",
    "custom software",
    "automation",
    "systems integration",
    "digital experience",
    "SEO",
    "cloud",
    "Azure",
    "FinOps",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title,
    description: site.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "TurtleWorks — a turtle swimming through deep water" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: site.description,
    url: site.url,
    logo: `${site.url}/brand/turtleworks-mark.png`,
    ...(site.email ? { email: site.email } : {}),
    slogan: site.tagline,
    knowsAbout: [
      "Business consulting",
      "Custom software development",
      "Automation and systems integration",
      "Digital experience design",
      "Search engine optimization",
      "Cloud and cost visibility",
    ],
  };
}
