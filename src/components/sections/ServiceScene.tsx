"use client";

import type { CSSProperties, ReactNode } from "react";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";

/*
  One small scene per service: the moment the customer gets the result,
  drawn in code. Each plays once when it scrolls into view, then rests on
  the finished frame; that frame is also what no-JS and reduced-motion
  visitors see. "Your Business" stands in for the customer's own.
*/

const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Scene({ label, children }: { label: string; children: ReactNode }) {
  const { ref, visible } = useIntersectionReveal<HTMLElement>({ threshold: 0.5 });

  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      className={`gv ${visible ? "gv--play" : ""} relative flex h-56 flex-col justify-center overflow-hidden rounded-2xl border border-[rgba(220,235,228,0.12)] bg-[rgba(11,26,21,0.88)] p-4`}
    >
      {children}
    </figure>
  );
}

const glyph = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-3.5 w-3.5">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
};

function Website() {
  return (
    <Scene label="Illustration: a mobile website for your business builds itself, then a new enquiry from the website arrives.">
      <div className="absolute bottom-0 left-4 top-4 flex w-[46%] flex-col gap-2 rounded-t-xl border border-b-0 border-[rgba(220,235,228,0.16)] bg-[rgba(5,9,8,0.6)] p-3">
        <p className="gv-step flex items-center gap-1.5 text-xs font-medium text-ivory" style={at(0)}>
          <span className="h-2 w-2 rounded-full bg-amber" />
          Your Business
        </p>
        <div
          className="gv-step h-10 rounded-md bg-[linear-gradient(135deg,rgba(29,91,70,0.95),rgba(29,91,70,0.35))]"
          style={at(140)}
        />
        <div className="gv-step flex flex-col gap-1.5" style={at(260)}>
          <span className="h-1.5 w-full rounded-full bg-[rgba(220,235,228,0.18)]" />
          <span className="h-1.5 w-3/4 rounded-full bg-[rgba(220,235,228,0.18)]" />
        </div>
        <span
          className="gv-step mt-auto rounded-full bg-evergreen py-1.5 text-center text-xs font-medium text-ivory"
          style={at(380)}
        >
          WhatsApp us
        </span>
      </div>
      <div
        className="gv-step absolute bottom-5 right-4 w-[46%] rounded-xl bg-[#12271f] p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)]"
        style={at(900)}
      >
        <p className="flex items-center gap-1.5 text-xs font-medium text-ivory">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
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
        className="gv-step flex items-center gap-2 rounded-full bg-[rgba(220,235,228,0.08)] px-3 py-2 text-xs text-ivory-soft"
        style={at(0)}
      >
        <span className="text-ivory-muted">{glyph.search}</span>
        bakery near me
      </div>
      <div className="gv-step mt-3 rounded-lg bg-[rgba(224,168,82,0.1)] px-3 py-2" style={at(320)}>
        <p className="text-xs text-ivory-muted">yourbusiness.in</p>
        <p className="font-display text-sm font-semibold text-mint">Your Business · Fresh bakes daily</p>
      </div>
      <div className="gv-step mt-3 px-1" style={at(680)}>
        <p className="flex items-center gap-1.5 text-xs text-gold">
          {glyph.spark}
          AI answer
        </p>
        <p className="mt-0.5 text-xs text-ivory-soft">
          A popular choice nearby is <span className="font-medium text-ivory">Your Business</span>.
        </p>
      </div>
    </Scene>
  );
}

function Automation() {
  return (
    <Scene label="Illustration: a customer asks on WhatsApp if you're open on Sunday and gets an instant automatic reply; an invoice and a reminder go out on their own.">
      <p className="flex items-center gap-1.5 text-xs text-ivory-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-mint" />
        WhatsApp · auto-reply on
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <p
          className="gv-step max-w-[78%] self-start rounded-2xl rounded-bl-md bg-[rgba(220,235,228,0.09)] px-3 py-1.5 text-xs text-ivory-soft"
          style={at(0)}
        >
          Are you open on Sunday?
        </p>
        <p
          className="gv-step max-w-[82%] self-end rounded-2xl rounded-br-md bg-evergreen px-3 py-1.5 text-xs text-ivory"
          style={at(450)}
        >
          Yes, 10am to 6pm. Shall I book you a slot?
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mint">
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
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ivory">Bookings · Today</span>
        <span className="gv-step text-mint" style={at(1050)}>
          3 booked
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {bookings.map((b, i) => (
          <div
            key={b.time}
            className="flex items-center gap-3 rounded-md bg-[rgba(220,235,228,0.05)] px-2.5 py-1 text-xs"
          >
            <span className="w-10 tabular-nums text-ivory-muted">{b.time}</span>
            <span className="gv-step text-ivory" style={at(200 + i * 260)}>
              {b.name}
            </span>
            <span
              className="gv-step ml-auto rounded-full bg-evergreen px-2 py-0.5 text-ivory"
              style={at(320 + i * 260)}
            >
              Booked
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-md border border-dashed border-[rgba(220,235,228,0.16)] px-2.5 py-1 text-xs">
          <span className="w-10 tabular-nums text-ivory-muted">15:00</span>
          <span className="text-ivory-muted">Free slot</span>
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
              className="gv-fly rounded-full bg-[rgba(220,235,228,0.08)] px-2.5 py-1 text-xs text-ivory-soft"
              style={at(i * 160)}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex h-full flex-col rounded-xl bg-[rgba(5,9,8,0.55)] p-3">
          <div className="gv-step grid grid-cols-2 gap-2" style={at(560)}>
            <div>
              <p className="text-xs text-ivory-muted">Enquiries</p>
              <p className="font-display text-lg font-semibold tabular-nums text-ivory">24</p>
            </div>
            <div>
              <p className="text-xs text-ivory-muted">Sales</p>
              <p className="font-display text-lg font-semibold tabular-nums text-ivory">₹1.8L</p>
            </div>
          </div>
          <div className="mt-auto flex h-14 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className={`gv-bar flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-amber" : "bg-[rgba(220,235,228,0.22)]"}`}
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

function Plan() {
  return (
    <Scene label="Illustration: a one-page plan that ranks what to fix first and crosses out what you don't need.">
      <p className="text-xs font-medium text-ivory">Your plan</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {plan.map((p, i) => (
          <div key={p.text} className="flex items-center justify-between gap-3 text-xs">
            <span className={`relative ${p.cut ? "text-ivory-muted" : "text-ivory-soft"}`}>
              {p.text}
              {p.cut ? (
                <span
                  className="gv-strike absolute inset-x-0 top-1/2 h-px bg-ivory-muted"
                  style={at(350 + i * 220)}
                />
              ) : null}
            </span>
            <span
              className={`gv-step shrink-0 rounded-full px-2 py-0.5 ${
                i === 0 ? "bg-[rgba(224,168,82,0.18)] text-gold" : "bg-[rgba(220,235,228,0.08)] text-ivory-soft"
              }`}
              style={at(1000 + i * 150)}
            >
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
