"use client";

import type { CSSProperties, ReactNode } from "react";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

/*
  One small "what you get" screen per service group, drawn in code (no image
  weight). Plays a single build-up when scrolled into view, then rests; the
  settled frame is the default, so no-JS and reduced-motion see it complete.
  Illustrative only: "Your Business" stands in for the customer's own.
*/

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Frame({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  const { ref, visible } = useIntersectionReveal<HTMLElement>({ threshold: 0.4 });

  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      className={`gv ${visible ? "gv--play" : ""} mt-8 max-w-sm rounded-2xl border border-[rgba(220,235,228,0.12)] bg-[rgba(11,26,21,0.88)] p-5 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)]`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-ivory-muted">{title}</span>
        <span className="text-gold">Illustrative</span>
      </div>
      {children}
    </figure>
  );
}

function GetFound() {
  return (
    <Frame
      title="Search"
      label="Illustration: a customer searches for a bakery nearby and finds your business at the top of Google and recommended in an AI answer."
    >
      <div
        className="gv-step mt-4 flex items-center gap-2 rounded-full border border-[rgba(220,235,228,0.14)] px-3 py-2 text-sm text-ivory-soft"
        style={at(0)}
      >
        <ServiceIcon id="seo-geo" className="h-4 w-4 text-ivory-muted" />
        bakery near me
      </div>
      <div
        className="gv-step mt-3 rounded-xl border border-[rgba(232,183,106,0.35)] bg-[rgba(232,183,106,0.06)] p-3"
        style={at(260)}
      >
        <p className="text-xs text-ivory-muted">yourbusiness.in</p>
        <p className="mt-0.5 font-display text-sm font-semibold text-mint">
          Your Business · Fresh bakes daily
        </p>
        <div className="mt-2 h-1.5 w-4/5 rounded-full bg-[rgba(220,235,228,0.14)]" />
      </div>
      <div className="gv-step mt-3 rounded-xl border border-[rgba(220,235,228,0.12)] p-3" style={at(560)}>
        <p className="flex items-center gap-1.5 text-xs text-gold">
          <ServiceIcon id="brand" className="h-3.5 w-3.5" />
          AI answer
        </p>
        <p className="mt-1 text-sm text-ivory-soft">
          A popular choice nearby is <span className="font-medium text-ivory">Your Business</span>.
        </p>
      </div>
    </Frame>
  );
}

function RunSmoother() {
  return (
    <Frame
      title="WhatsApp"
      label="Illustration: a customer asks on WhatsApp whether you're open on Sunday and gets an instant automatic reply, and the enquiry is logged with a follow-up set."
    >
      <div className="mt-4 flex items-center gap-2.5 border-b border-[rgba(220,235,228,0.1)] pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-evergreen font-display text-xs font-semibold text-ivory">
          YB
        </span>
        <div>
          <p className="text-sm font-medium text-ivory">Your Business</p>
          <p className="flex items-center gap-1.5 text-xs text-ivory-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Auto-reply on
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <p
          className="gv-step max-w-[80%] self-start rounded-2xl rounded-bl-md bg-[rgba(220,235,228,0.08)] px-3 py-2 text-sm text-ivory-soft"
          style={at(0)}
        >
          Hi, are you open on Sunday?
        </p>
        <p
          className="gv-step max-w-[85%] self-end rounded-2xl rounded-br-md bg-evergreen px-3 py-2 text-sm text-ivory"
          style={at(420)}
        >
          Yes, 10am to 6pm. Shall I book you a slot?
          <span className="mt-0.5 block text-right text-xs text-mint">Instant auto-reply</span>
        </p>
      </div>
      <p className="gv-step mt-3 flex items-center gap-1.5 text-xs text-mint" style={at(780)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        Enquiry logged · follow-up set
      </p>
    </Frame>
  );
}

const week = [
  { day: "M", h: 38 },
  { day: "T", h: 52 },
  { day: "W", h: 46 },
  { day: "T", h: 64 },
  { day: "F", h: 58 },
  { day: "S", h: 78 },
  { day: "S", h: 92 },
];

function SeeClearly() {
  return (
    <Frame
      title="This week"
      label="Illustration: a simple dashboard with this week's enquiries and sales, and a bar chart of daily leads rising towards the weekend."
    >
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { k: "Enquiries", v: "24", d: "+6 on last week" },
          { k: "Sales", v: "₹1.8L", d: "+12% on last week" },
        ].map((m, i) => (
          <div
            key={m.k}
            className="gv-step rounded-xl border border-[rgba(220,235,228,0.12)] p-3"
            style={at(i * 140)}
          >
            <p className="text-xs text-ivory-muted">{m.k}</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-ivory">{m.v}</p>
            <p className="text-xs text-mint">{m.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-20 items-end gap-2">
        {week.map((b, i) => (
          <span
            key={i}
            className={`gv-bar flex-1 rounded-t-sm ${i === week.length - 1 ? "bg-amber" : "bg-[rgba(220,235,228,0.22)]"}`}
            style={{ height: `${b.h}%`, ...at(300 + i * 70) }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {week.map((b, i) => (
          <span key={i} className="flex-1 text-center text-xs text-ivory-muted">
            {b.day}
          </span>
        ))}
      </div>
    </Frame>
  );
}

const visuals: Record<string, () => ReactNode> = {
  grow: GetFound,
  run: RunSmoother,
  see: SeeClearly,
};

export function GroupVisual({ id }: { id: string }) {
  const Visual = visuals[id];
  return Visual ? <Visual /> : null;
}
