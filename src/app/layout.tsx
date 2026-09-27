import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, manrope } from "@/lib/fonts";
import { jsonLd, metadata as siteMetadata, organizationJsonLd } from "@/lib/seo";
import { AnalyticsGate } from "@/components/AnalyticsGate";
import { HydrationMark } from "@/components/HydrationMark";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#050908",
  colorScheme: "dark",
};

// Marks JS as running so scroll reveals may start hidden. If the app hasn't
// hydrated within 4s (blocked or failed chunk), the mark is removed and all
// content shows. Nothing is ever hidden without JS.
const jsMark = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__twReady)document.documentElement.classList.remove('js')},4000);`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsMark }} />
      </head>
      <body className="min-h-full">
        <a
          href="#top"
          className="sr-only [text-shadow:none] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ivory focus:px-4 focus:py-2 focus:text-sm focus:text-abyss"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
        />
        <HydrationMark />
        <AnalyticsGate />
      </body>
    </html>
  );
}
