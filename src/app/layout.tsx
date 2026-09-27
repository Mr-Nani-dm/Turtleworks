import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, manrope } from "@/lib/fonts";
import { metadata as siteMetadata, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#050908",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full">
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ivory focus:px-4 focus:py-2 focus:text-sm focus:text-abyss"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </body>
    </html>
  );
}
