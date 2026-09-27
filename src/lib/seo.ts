import type { Metadata } from "next";
import { site } from "@/data/site";

const title = site.name + " — " + site.descriptor;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: "%s — " + site.name,
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
    images: [{ url: "/og.png", width: 1712, height: 963, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export function organizationJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: site.description,
    url: site.url,
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

  return site.email ? { ...organization, email: site.email } : organization;
}
