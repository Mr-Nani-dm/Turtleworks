import type { Metadata } from "next";
import { site } from "@/data/site";

const defaultTitle = `${site.name} — ${site.descriptor}`;
const ogImage = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "TurtleWorks — a turtle swimming through deep water",
};

/*
  Next.js merges metadata shallowly: a page that sets `openGraph` replaces the
  layout's whole object. So the layout holds no page-specific URL or
  canonical, and every indexable page builds its own via `pageMetadata`.
*/
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: defaultTitle, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: defaultTitle,
    description: site.description,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.description,
    images: [ogImage.url],
  },
};

// Indexing directives live on indexable pages only, so the 404 and
// confirmation pages never inherit a conflicting "index, follow".
const indexable: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large" },
};

export function pageMetadata({
  path,
  title,
  description = site.description,
}: {
  path: string;
  title?: string;
  description?: string;
}): Metadata {
  const fullTitle = title ? `${title} — ${site.name}` : defaultTitle;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    robots: indexable,
    openGraph: {
      type: "website",
      siteName: site.name,
      url: path,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}

/** Serialises structured data safely for a <script> tag (per Next.js JSON-LD guide). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: site.description,
    url: site.url,
    logo: `${site.url}/brand/turtleworks-mark.png`,
    ...(site.email ? { email: site.email } : {}),
    ...(site.legalName ? { legalName: site.legalName } : {}),
    ...(site.location ? { location: { "@type": "Place", name: site.location } } : {}),
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
