import localFont from "next/font/local";

// Self-hosted variable fonts (no external requests).
// Inter — body/interface · Manrope — display/headings.
export const inter = localFont({
  src: "../fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export const manrope = localFont({
  src: "../fonts/Manrope-Variable.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
  fallback: ["system-ui", "arial"],
});
