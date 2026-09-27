"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ContactErrors,
  ContactField,
  contactLimits,
  validateContact,
} from "@/lib/contact-schema";
import { ArrowRight, Check } from "@/components/ui/Icons";

type Status = "idle" | "sending" | "sent" | "error";

type Props = {
  email: string | null;
  bookingUrl: string | null;
};

const FIELD_ORDER: ContactField[] = ["name", "email", "company", "message"];

const inputClass = (invalid: boolean) =>
  "mt-2 block w-full rounded-xl border bg-[rgba(5,9,8,0.6)] px-4 py-3 text-base text-ivory " +
  "placeholder:text-[color:color-mix(in_srgb,var(--color-sage)_75%,transparent)] " +
  "transition-[border-color,box-shadow] duration-200 [text-shadow:none] " +
  "focus:outline-none focus:ring-2 " +
  (invalid
    ? "border-alert focus:border-alert focus:ring-[rgba(242,164,136,0.35)]"
    : "border-[rgba(220,235,228,0.18)] hover:border-[rgba(220,235,228,0.3)] focus:border-amber focus:ring-[rgba(197,138,46,0.35)]");

export function ContactForm({ email, bookingUrl }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  const values = () => Object.fromEntries(new FormData(formRef.current!));

  const revalidate = (field: ContactField) => {
    if (!errors[field]) return;
    const result = validateContact(values());
    setErrors((prev) => ({ ...prev, [field]: result.ok ? undefined : result.errors[field] }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const raw = values();
    const result = validateContact(raw);
    if (!result.ok) {
      setErrors(result.errors);
      setProblem(null);
      const first = FIELD_ORDER.find((f) => result.errors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setProblem(null);
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...raw, startedAt: startedAt.current }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("sent");
        return;
      }
      setStatus("error");
      if (res.status === 400 && body.errors) {
        setErrors(body.errors);
        setProblem("Please check the highlighted fields.");
      } else if (res.status === 429) {
        setProblem("You've sent several messages in a short time. Please wait a few minutes and try again.");
      } else if (res.status === 503) {
        setProblem("Online enquiries aren't connected at the moment, so your message wasn't sent.");
      } else {
        setProblem("Something went wrong on our side and your message wasn't sent. Your text is still here — please try again.");
      }
    } catch {
      setStatus("error");
      setProblem("We couldn't reach the server. Check your connection and try again — your text is still here.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-[rgba(220,235,228,0.14)] bg-[rgba(8,19,15,0.55)] p-8 backdrop-blur-sm md:p-10">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber text-abyss">
          <Check size={20} />
        </span>
        <h3 ref={successRef} tabIndex={-1} className="mt-6 font-display text-2xl text-ivory focus:outline-none">
          Thanks — your message is with us.
        </h3>
        <p className="mt-3 max-w-md leading-relaxed text-[color:color-mix(in_srgb,var(--color-ivory)_80%,transparent)]">
          We&rsquo;ll read it properly and reply personally to arrange a conversation.
        </p>
      </div>
    );
  }

  const fieldError = (field: ContactField) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-2 text-sm text-alert">
        {errors[field]}
      </p>
    ) : null;

  const describedBy = (field: ContactField, hint?: string) =>
    [hint, errors[field] ? `${field}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <form
      ref={formRef}
      action="/api/contact"
      method="post"
      noValidate
      onSubmit={onSubmit}
      aria-describedby="contact-form-note"
      className="rounded-2xl border border-[rgba(220,235,228,0.14)] bg-[rgba(8,19,15,0.55)] p-6 backdrop-blur-sm sm:p-8 md:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ivory">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={contactLimits.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            onChange={() => revalidate("name")}
            className={inputClass(Boolean(errors.name))}
          />
          {fieldError("name")}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ivory">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={contactLimits.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            onChange={() => revalidate("email")}
            className={inputClass(Boolean(errors.email))}
          />
          {fieldError("email")}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company" className="text-sm font-medium text-ivory">
            Company <span className="font-normal text-sage">(optional)</span>
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={contactLimits.company}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={describedBy("company")}
            onChange={() => revalidate("company")}
            className={inputClass(Boolean(errors.company))}
          />
          {fieldError("company")}
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="message" className="text-sm font-medium text-ivory">
              What problem are you trying to solve?
            </label>
            <span className="text-xs tabular-nums text-sage" aria-hidden>
              {messageLength}/{contactLimits.message}
            </span>
          </div>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            maxLength={contactLimits.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message", "message-hint")}
            onChange={(e) => {
              setMessageLength(e.target.value.length);
              revalidate("message");
            }}
            className={`${inputClass(Boolean(errors.message))} min-h-36 resize-y leading-relaxed`}
          />
          <p id="message-hint" className="mt-2 text-sm text-sage">
            A few lines is plenty — what&rsquo;s happening, and what you&rsquo;d like to change.
          </p>
          {fieldError("message")}
        </div>
      </div>

      {/* Spam trap: invisible to people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id="contact-form-note" className="max-w-xs text-xs leading-relaxed text-sage">
          We use your details only to reply to this enquiry. See our{" "}
          <Link href="/privacy" className="text-ivory underline underline-offset-4 hover:text-white">
            privacy notice
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={status === "sending"}
          aria-disabled={status === "sending"}
          className="group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-ivory px-6 py-3 text-sm font-medium text-abyss [text-shadow:none] transition-[transform,background-color,opacity] duration-300 hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {status === "sending" ? (
            <>
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-abyss/30 border-t-abyss motion-reduce:animate-none"
              />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden">
        {problem ? (
          <div className="mt-6 rounded-xl border border-[rgba(242,164,136,0.4)] bg-[rgba(242,164,136,0.08)] p-4 text-sm leading-relaxed text-ivory">
            <p>{problem}</p>
            {status === "error" && (bookingUrl || email) ? (
              <p className="mt-2 text-sage">
                You can also{" "}
                {bookingUrl ? (
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-ivory underline underline-offset-4">
                    book a call directly
                  </a>
                ) : null}
                {bookingUrl && email ? " or " : null}
                {email ? (
                  <a href={`mailto:${email}`} className="text-ivory underline underline-offset-4">
                    email {email}
                  </a>
                ) : null}
                .
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
