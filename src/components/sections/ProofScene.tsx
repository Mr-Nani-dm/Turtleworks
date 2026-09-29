"use client";

import type { CSSProperties } from "react";
import { Scene } from "@/components/sections/ServiceScene";
import { lighthouse } from "@/data/work";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const check = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const categories = [
  ["Performance", "performance"],
  ["Accessibility", "accessibility"],
  ["Best practices", "bestPractices"],
  ["SEO", "seo"],
] as const;

function WebsiteProof() {
  const { mobile, desktop, measured } = lighthouse;
  const label = `Google Lighthouse scores for this website, measured ${measured}. Mobile: ${categories
    .map(([name, key]) => `${name} ${mobile[key]}`)
    .join(", ")}. Desktop: ${categories.map(([name, key]) => `${name} ${desktop[key]}`).join(", ")}.`;

  return (
    <Scene label={label} className="p-6 md:p-8">
      <div className="flex items-center justify-between text-xs font-semibold text-slate">
        <span>Google Lighthouse</span>
        <span>{measured}</span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_auto]">
        <span />
        <span className="pb-2 pl-6 text-right text-xs font-semibold text-slate">Mobile</span>
        <span className="pb-2 pl-6 text-right text-xs font-semibold text-slate">Desktop</span>
        {categories.map(([name, key], i) => (
          <div key={key} className="contents">
            <span className="flex items-center border-t border-ink/10 py-2 text-sm">{name}</span>
            <span className="border-t border-ink/10 py-2 pl-6 text-right">
              <span
                className="gv-step inline-block font-display text-xl font-semibold tabular-nums text-evergreen"
                style={at(i * 140)}
              >
                {mobile[key]}
              </span>
            </span>
            <span className="border-t border-ink/10 py-2 pl-6 text-right">
              <span
                className="gv-step inline-block font-display text-xl font-semibold tabular-nums text-evergreen"
                style={at(70 + i * 140)}
              >
                {desktop[key]}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
        {["/llms.txt for AI answers", "Structured data"].map((chip, i) => (
          <span
            key={chip}
            className="gv-step inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-forest"
            style={at(700 + i * 120)}
          >
            {check}
            {chip}
          </span>
        ))}
      </div>
    </Scene>
  );
}

const run = [
  "Logged in the leads table",
  "Confirmation sent to the sender",
  "AI: best service fit suggested, spam risk low",
  "Draft reply ready for a person to check",
  "Reminder armed if it goes unanswered",
];

function EnquiryProof() {
  return (
    <Scene
      label="Illustration of our live enquiry system handling a new enquiry: logged, confirmed to the sender, sorted by AI, a draft reply prepared for a person to check, and a reminder armed."
      className="p-6 md:p-8"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate">
        <span>New enquiry · just now</span>
        <span className="flex items-center gap-1.5 text-evergreen">
          <span className="h-2 w-2 rounded-full bg-evergreen" />
          Live
        </span>
      </div>
      <ol className="relative mt-5 flex flex-col gap-3.5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-ink/15">
        {run.map((step, i) => (
          <li key={step} className="gv-step relative flex items-center gap-3 text-sm" style={at(i * 220)}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-evergreen text-ivory">
              {check}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </Scene>
  );
}

export function ProofScene({ id }: { id: "website" | "enquiries" }) {
  return id === "website" ? <WebsiteProof /> : <EnquiryProof />;
}
