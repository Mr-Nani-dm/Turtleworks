"use client";

import { useState, useRef, type FormEvent } from "react";
import type { Category, Check, Summary } from "@/lib/site-check/types";

type Result = { url: string; categories: Category[]; summary: Summary };
type Phase = "idle" | "scanning" | "teaser" | "capture" | "revealed" | "error";

const STATUS_ICON: Record<string, string> = { pass: "✓", warn: "!", fail: "✗", info: "i" };
const STATUS_COLOR: Record<string, string> = { pass: "text-mint", warn: "text-amber", fail: "text-alert", info: "text-sage" };
const STATUS_BG: Record<string, string> = {
  pass: "bg-[rgba(220,235,228,0.12)]",
  warn: "bg-[rgba(197,138,46,0.12)]",
  fail: "bg-[rgba(242,164,136,0.12)]",
  info: "bg-[rgba(173,191,182,0.08)]",
};

const STANDARD_ICONS: Record<string, string> = {
  "Google Search Essentials": "Google",
  "WCAG 2.1 (1.1.1)": "WCAG",
  "WCAG 2.1 (3.1.1)": "WCAG",
  "WCAG 2.1 (1.3.1)": "WCAG",
  "WCAG 2.1 (1.3.1, 4.1.2)": "WCAG",
  "Open Graph Protocol": "OGP",
  "RFC 9309 (robots.txt)": "RFC",
  "schema.org / Google Rich Results": "schema.org",
  "OWASP Security Guidelines": "OWASP",
  "OWASP Secure Headers Project": "OWASP",
  "GDPR / IT Act 2000": "GDPR",
  "Core Web Vitals (CLS)": "CWV",
  "Google PageSpeed Insights": "PageSpeed",
  "Industry best practice": "Best Practice",
  "llms-txt proposal (llmstxt.org)": "llms-txt",
};

function StandardBadge({ standard }: { standard: string }) {
  const short = STANDARD_ICONS[standard] ?? standard;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[rgba(220,235,228,0.12)] bg-[rgba(220,235,228,0.06)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-sage"
      title={standard}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint/50" aria-hidden />
      {short}
    </span>
  );
}

function CheckRow({ check }: { check: Check }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border border-[rgba(220,235,228,0.08)] ${STATUS_BG[check.status]}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${STATUS_COLOR[check.status]} border border-current`}
          aria-hidden
        >
          {STATUS_ICON[check.status]}
        </span>
        <span className="flex-1">
          <span className="text-sm font-medium text-ivory">{check.label}</span>
          <span className="ml-2 text-xs text-sage">{check.detail.slice(0, 80)}</span>
        </span>
        <StandardBadge standard={check.standard} />
        <span className="mt-1 text-xs text-sage">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-[rgba(220,235,228,0.06)] px-4 py-3 text-sm leading-relaxed text-ivory-soft">
          <p>{check.detail}</p>
          <p className="mt-2">
            <strong className="text-ivory">Why it matters:</strong> {check.why}
          </p>
          <p className="mt-2">
            <strong className="text-ivory">How to fix:</strong> {check.fix}
          </p>
          <p className="mt-2 text-xs text-sage">
            Based on: {check.standard}
          </p>
        </div>
      )}
    </div>
  );
}

function CategorySection({ cat, locked }: { cat: Category; locked?: boolean }) {
  const passed = cat.checks.filter((c) => c.status === "pass").length;
  const total = cat.checks.filter((c) => c.status !== "info").length;
  return (
    <div className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-ivory">{cat.label}</h2>
        <span className="text-sm text-sage">
          {passed}/{total} passed
        </span>
      </div>
      {locked ? (
        <div className="mt-3 grid gap-2">
          {cat.checks.map((check) => (
            <div key={check.id} className={`flex items-center gap-3 rounded-lg border border-[rgba(220,235,228,0.08)] ${STATUS_BG[check.status]} px-4 py-3`}>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${STATUS_COLOR[check.status]} border border-current`}
                aria-hidden
              >
                {STATUS_ICON[check.status]}
              </span>
              <span className="flex-1 text-sm font-medium text-ivory">{check.label}</span>
              <span className="rounded bg-[rgba(220,235,228,0.08)] px-2 py-0.5 text-[10px] text-sage">Locked</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {cat.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ summary }: { summary: Summary }) {
  const pct = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
  const color = pct >= 80 ? "text-mint" : pct >= 50 ? "text-amber" : "text-alert";
  return (
    <div className="flex items-center gap-6 rounded-xl border border-[rgba(220,235,228,0.1)] bg-[rgba(8,19,15,0.6)] px-6 py-5">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(220,235,228,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="16" fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className={`absolute text-xl font-bold ${color}`}>{pct}%</span>
      </div>
      <div>
        <p className="text-sm font-medium text-ivory">
          {summary.passed} of {summary.total} checks passed
        </p>
        {summary.gaps.length > 0 && (
          <p className="mt-1 text-sm text-sage">
            Top gaps: {summary.gaps.map((g) => g.label).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function TrustBar() {
  const standards = ["Google Search Essentials", "WCAG 2.1", "OWASP", "schema.org", "Core Web Vitals", "RFC 9309"];
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {standards.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(220,235,228,0.12)] bg-[rgba(220,235,228,0.04)] px-3 py-1 text-xs text-sage">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint/60" aria-hidden />
          {s}
        </span>
      ))}
    </div>
  );
}

function LeadCaptureForm({ onComplete }: { onComplete: (data: { name: string; contact: string }) => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState("");

  function validateContact(v: string): boolean {
    const trimmed = v.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
    const digits = trimmed.replace(/[\s()+\-]/g, "");
    if (/^\d{10,15}$/.test(digits)) return true;
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    if (!validateContact(contact)) {
      setContactError("Please enter a valid email or phone number");
      return;
    }
    setContactError("");
    setSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: contact.trim(),
          message: "[Site Check lead] Requested full audit results",
        }),
      });
    } catch { /* best effort */ }
    setSending(false);
    onComplete({ name: name.trim(), contact: contact.trim() });
  }

  return (
    <div className="rounded-xl border border-amber/30 bg-[rgba(197,138,46,0.06)] px-6 py-6">
      <h3 className="text-base font-semibold text-ivory">See your full results</h3>
      <p className="mt-1 text-sm text-ivory-soft">
        Enter your name and email or WhatsApp number to unlock the detailed report.
        We&rsquo;ll only use it to send you the report and follow up if you want help.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="sr-only">Name</label>
          <input
            id="lead-name"
            type="text"
            placeholder="Your name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[rgba(220,235,228,0.18)] bg-[rgba(8,19,15,0.7)] px-4 py-2.5 text-sm text-ivory placeholder:text-sage focus:border-amber focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="lead-contact" className="sr-only">Email or WhatsApp</label>
          <input
            id="lead-contact"
            type="text"
            placeholder="Email or WhatsApp number"
            required
            value={contact}
            onChange={(e) => { setContact(e.target.value); setContactError(""); }}
            className="w-full rounded-lg border border-[rgba(220,235,228,0.18)] bg-[rgba(8,19,15,0.7)] px-4 py-2.5 text-sm text-ivory placeholder:text-sage focus:border-amber focus:outline-none"
          />
          {contactError && <p className="mt-1 text-xs text-alert">{contactError}</p>}
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-abyss transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 sm:col-span-2 [text-shadow:none]"
        >
          {sending ? "Sending..." : "Unlock full report"}
        </button>
      </form>
      <p className="mt-3 text-center text-[11px] text-sage">
        No spam. No auto-calls. Just the report.
      </p>
    </div>
  );
}

export function SiteCheckForm() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    const url = inputRef.current?.value.trim();
    if (!url) return;

    setPhase("scanning");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/site-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.ok) {
        const reasons: Record<string, string> = {
          "rate-limited": "Too many requests. Wait a minute and try again.",
          "missing-url": "Please enter a website address.",
          "invalid-url": "That doesn't look like a public website address.",
          "fetch-failed": "Could not reach that website. Check the address and try again.",
        };
        setError(reasons[data.error] ?? "Something went wrong. Try again.");
        setPhase("error");
        return;
      }
      setResult({ url: data.url, categories: data.categories, summary: data.summary });
      setPhase("teaser");
    } catch {
      setError("Network error. Check your connection and try again.");
      setPhase("error");
    }
  }

  function handleLeadComplete() {
    setPhase("revealed");
  }

  return (
    <div className="mt-2">
      {/* URL input */}
      <form onSubmit={handleScan} className="flex gap-3 max-sm:flex-col">
        <input
          ref={inputRef}
          type="text"
          name="url"
          placeholder="e.g. sharma-interiors.com"
          autoComplete="url"
          required
          disabled={phase === "scanning"}
          className="flex-1 rounded-full border border-[rgba(220,235,228,0.18)] bg-[rgba(8,19,15,0.7)] px-5 py-3 text-sm text-ivory placeholder:text-sage focus:border-amber focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={phase === "scanning"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-abyss transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 [text-shadow:none]"
        >
          {phase === "scanning" ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-abyss border-t-transparent" />
              Checking...
            </>
          ) : (
            "Check my site"
          )}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-alert">{error}</p>}

      {phase === "scanning" && (
        <div className="mt-8 text-sm text-sage">
          <p>Fetching the page, checking robots.txt, sitemap, and llms.txt...</p>
          <p className="mt-1">This usually takes about 10 seconds.</p>
        </div>
      )}

      {/* Teaser: score visible, categories blurred */}
      {result && phase === "teaser" && (
        <div className="mt-8">
          <p className="text-sm text-sage">
            Results for{" "}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-ivory underline underline-offset-4">
              {result.url}
            </a>
          </p>
          <div className="mt-4">
            <ScoreBadge summary={result.summary} />
          </div>
          <TrustBar />
          {result.categories.map((cat) => (
            <CategorySection key={cat.id} cat={cat} locked />
          ))}
          <div className="mt-8">
            <LeadCaptureForm onComplete={handleLeadComplete} />
          </div>
        </div>
      )}

      {/* Capture phase (same as teaser but showing form prominently) */}
      {result && phase === "capture" && (
        <div className="mt-8">
          <LeadCaptureForm onComplete={handleLeadComplete} />
        </div>
      )}

      {/* Full results revealed */}
      {result && phase === "revealed" && (
        <div className="mt-8">
          <p className="text-sm text-sage">
            Results for{" "}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-ivory underline underline-offset-4">
              {result.url}
            </a>
          </p>
          <div className="mt-4">
            <ScoreBadge summary={result.summary} />
          </div>
          <TrustBar />
          {result.categories.map((cat) => (
            <CategorySection key={cat.id} cat={cat} />
          ))}
          <div className="mt-12 rounded-xl border border-[rgba(220,235,228,0.1)] bg-[rgba(29,91,70,0.08)] px-6 py-5">
            <p className="text-sm font-medium text-ivory">Want help fixing these?</p>
            <p className="mt-1 text-sm text-ivory-soft">
              We build websites, set up SEO, and connect businesses to their customers.
              The check is free &mdash; if you want help with any of the findings, get in touch.
            </p>
            <a
              href="/#contact"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-[rgba(220,235,228,0.28)] bg-[rgba(8,19,15,0.6)] px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:border-amber hover:bg-[rgba(8,19,15,0.78)]"
            >
              Talk to us
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
