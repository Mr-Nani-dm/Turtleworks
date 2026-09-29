import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Fixed dates: bump them when a page's content actually changes, so search
  // engines can trust lastmod.
  return [
    { url: site.url, lastModified: "2026-09-29", changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/privacy`, lastModified: "2026-09-27", changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/terms`, lastModified: "2026-09-27", changeFrequency: "yearly", priority: 0.2 },
  ];
}
