"use client";

import type { CSSProperties, ReactNode } from "react";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";

/*
  One small scene per service: the moment the customer gets the result,
  drawn in code as a bright ivory "screen" so it reads as the focal point
  against the dark film. Each plays once when it scrolls into view, then
  rests on the finished frame; that frame is also what no-JS and
  reduced-motion visitors see. "Your Business" stands in for the customer's own.
*/

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function Scene({
  label,
  children,
  className = "h-56 p-5",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const { ref, visible } = useIntersectionReveal<HTMLElement>({ threshold: 0.5 });

  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      className={`gv ${visible ? "gv--play" : ""} relative flex flex-col justify-center overflow-hidden rounded-2xl bg-ivory text-ink [text-shadow:none] shadow-[0_28px_60px_-30px_rgba(0,0,0,0.95)] ${className}`}
    >
      {children}
    </figure>
  );
}

const glyph = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
};

function Website() {
  return (
    <Scene label="Illustration: a mobile website for your business builds itself, then a new enquiry from the website arrives.">
      <div className="absolute bottom-0 left-5 top-5 flex w-[46%] flex-col gap-2 rounded-t-2xl border-2 border-b-0 border-ink/80 bg-white p-3">
        <p className="gv-step flex items-center gap-1.5 text-xs font-semibold" style={at(0)}>
          <span className="h-2 w-2 rounded-full bg-amber" />
          Your Business
        </p>
        <div
          className="gv-step flex h-12 items-end rounded-lg bg-[linear-gradient(135deg,var(--color-evergreen),var(--color-forest))] p-2 text-xs font-semibold text-ivory"
          style={at(140)}
        >
          Fresh bakes daily
        </div>
        <span
          className="gv-step mt-auto rounded-full bg-evergreen py-1.5 text-center text-xs font-semibold text-ivory"
          style={at(320)}
        >
          WhatsApp us
        </span>
      </div>
      <div
        className="gv-step absolute bottom-6 right-5 w-[44%] rounded-xl bg-ink p-3 text-ivory shadow-[0_14px_30px_-14px_rgba(0,0,0,0.8)]"
        style={at(900)}
      >
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-mint" />
          New enquiry
        </p>
        <p className="mt-0.5 text-xs text-ivory-muted">From your website, just now</p>
      </div>
    </Scene>
  );
}

function GetFound() {
  return (
    <Scene label="Illustration: someone searches for a bakery nearby; your business comes up first on Google and is named in an AI answer.">
      <div
        className="gv-step flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm shadow-[0_2px_8px_-3px_rgba(23,33,29,0.25)] ring-1 ring-ink/10"
        style={at(0)}
      >
        <span className="text-slate">{glyph.search}</span>
        bakery near me
      </div>
      <div className="gv-step mt-3 rounded-lg bg-mint px-3.5 py-2" style={at(320)}>
        <p className="text-xs text-slate">yourbusiness.in</p>
        <p className="font-display text-sm font-bold text-forest">Your Business · Fresh bakes daily</p>
      </div>
      <div className="gv-step mt-3 px-1" style={at(680)}>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate">
          <span className="text-amber">{glyph.spark}</span>
          AI answer
        </p>
        <p className="mt-0.5 text-sm">
          A popular choice nearby is <span className="font-semibold text-forest">Your Business</span>.
        </p>
      </div>
    </Scene>
  );
}

function Automation() {
  return (
    <Scene label="Illustration: a customer asks on WhatsApp if you're open on Sunday and gets an instant automatic reply; an invoice and a reminder go out on their own.">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate">
        <span className="h-2 w-2 rounded-full bg-evergreen" />
        WhatsApp · auto-reply on
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <p
          className="gv-step max-w-[78%] self-start rounded-2xl rounded-bl-md bg-white px-3 py-1.5 text-sm shadow-[0_2px_8px_-3px_rgba(23,33,29,0.25)] ring-1 ring-ink/10"
          style={at(0)}
        >
          Are you open on Sunday?
        </p>
        <p
          className="gv-step max-w-[84%] self-end rounded-2xl rounded-br-md bg-evergreen px-3 py-1.5 text-sm text-ivory"
          style={at(450)}
        >
          Yes, 10am to 6pm. Shall I book you a slot?
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-evergreen">
        <span className="gv-step flex items-center gap-1" style={at(850)}>
          {glyph.check}
          Invoice sent
        </span>
        <span className="gv-step flex items-center gap-1" style={at(1050)}>
          {glyph.check}
          Reminder set · 10am
        </span>
      </div>
    </Scene>
  );
}

const bookings = [
  { time: "10:00", name: "Priya S." },
  { time: "11:30", name: "Arjun K." },
  { time: "13:00", name: "Meera R." },
];

function Software() {
  return (
    <Scene label="Illustration: a simple booking app for your business fills up with today's appointments.">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Bookings · Today</span>
        <span className="gv-step text-xs font-semibold text-evergreen" style={at(1050)}>
          3 booked
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {bookings.map((b, i) => (
          <div key={b.time} className="flex items-center gap-3 rounded-lg bg-white px-3 py-1 text-sm ring-1 ring-ink/10">
            <span className="w-11 text-xs tabular-nums text-slate">{b.time}</span>
            <span className="gv-step font-medium" style={at(200 + i * 260)}>
              {b.name}
            </span>
            <span
              className="gv-step ml-auto rounded-full bg-evergreen px-2 py-0.5 text-xs font-semibold text-ivory"
              style={at(320 + i * 260)}
            >
              Booked
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate/40 px-3 py-1 text-sm">
          <span className="w-11 text-xs tabular-nums text-slate">15:00</span>
          <span className="text-slate">Free slot</span>
        </div>
      </div>
    </Scene>
  );
}

const sources = ["Sheets", "WhatsApp", "Bank"];
const bars = [36, 50, 44, 62, 58, 78, 92];

function Dashboards() {
  return (
    <Scene label="Illustration: numbers from spreadsheets, WhatsApp and the bank flow into one dashboard showing this week's enquiries and sales.">
      <div className="grid h-full grid-cols-[auto_1fr] items-center gap-3">
        <div className="flex flex-col gap-2">
          {sources.map((s, i) => (
            <span
              key={s}
              className="gv-fly rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-ink/10"
              style={at(i * 160)}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex h-full flex-col rounded-xl bg-ink p-3 text-ivory">
          <div className="gv-step grid grid-cols-2 gap-2" style={at(560)}>
            <div>
              <p className="text-xs text-ivory-muted">Enquiries</p>
              <p className="font-display text-xl font-semibold tabular-nums">24</p>
            </div>
            <div>
              <p className="text-xs text-ivory-muted">Sales</p>
              <p className="font-display text-xl font-semibold tabular-nums">₹1.8L</p>
            </div>
          </div>
          <div className="mt-auto flex h-14 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className={`gv-bar flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-amber" : "bg-mint/35"}`}
                style={{ height: `${h}%`, ...at(700 + i * 60) }}
              />
            ))}
          </div>
        </div>
      </div>
    </Scene>
  );
}

const plan = [
  { text: "Reply to WhatsApp enquiries faster", tag: "Do first" },
  { text: "Speed up the website", tag: "Next" },
  { text: "Buy a big CRM system", tag: "Skip", cut: true },
  { text: "Rebuild everything", tag: "Skip", cut: true },
];

const tagStyle = ["bg-amber font-semibold text-ink", "bg-mint text-ink", "bg-ink/5 text-slate", "bg-ink/5 text-slate"];

function Plan() {
  return (
    <Scene label="Illustration: a one-page plan that ranks what to fix first and crosses out what you don't need.">
      <p className="text-sm font-semibold">Your plan</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {plan.map((p, i) => (
          <div key={p.text} className="flex items-center justify-between gap-3 text-sm">
            <span className={`relative ${p.cut ? "text-slate" : ""}`}>
              {p.text}
              {p.cut ? (
                <span
                  className="gv-strike absolute inset-x-0 top-1/2 h-px bg-slate"
                  style={at(350 + i * 220)}
                />
              ) : null}
            </span>
            <span className={`gv-step shrink-0 rounded-full px-2 py-0.5 text-xs ${tagStyle[i]}`} style={at(1000 + i * 150)}>
              {p.tag}
            </span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

const scenes: Record<string, () => ReactNode> = {
  website: Website,
  "get-found": GetFound,
  automation: Automation,
  software: Software,
  dashboards: Dashboards,
  plan: Plan,
};

export function ServiceScene({ id }: { id: string }) {
  const Visual = scenes[id];
  return Visual ? <Visual /> : null;
}
