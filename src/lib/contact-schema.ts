export type ContactInput = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export type ContactField = keyof ContactInput;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const contactLimits = {
  name: 100,
  email: 200,
  company: 120,
  messageMin: 10,
  message: 4000,
} as const;

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// Control and invisible format characters (incl. bidi overrides used to spoof
// names and subjects). Single-line fields drop them all; the message keeps
// line breaks and tabs.
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
const INVISIBLE_EXCEPT_LINES = /[\p{Cf}\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu;

const line = (value: unknown) =>
  typeof value === "string" ? value.replace(INVISIBLE, " ").replace(/\s+/g, " ").trim() : "";

const block = (value: unknown) =>
  typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").replace(INVISIBLE_EXCEPT_LINES, "").trim()
    : "";

/** Shared by the form (instant feedback) and the API (source of truth). */
export function validateContact(raw: Record<string, unknown>):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: ContactErrors } {
  const data: ContactInput = {
    name: line(raw.name),
    email: line(raw.email).toLowerCase(),
    company: line(raw.company),
    message: block(raw.message),
  };
  const errors: ContactErrors = {};

  if (!data.name) errors.name = "Please tell us your name.";
  else if (data.name.length > contactLimits.name)
    errors.name = `Please keep your name under ${contactLimits.name} characters.`;

  if (!data.email) errors.email = "We need an email address to reply to you.";
  else if (data.email.length > contactLimits.email || !EMAIL_PATTERN.test(data.email))
    errors.email = "That email address doesn't look right — please check it.";

  if (data.company.length > contactLimits.company)
    errors.company = `Please keep this under ${contactLimits.company} characters.`;

  if (data.message.length < contactLimits.messageMin)
    errors.message = "A sentence or two about the problem helps us reply usefully.";
  else if (data.message.length > contactLimits.message)
    errors.message = `Please keep this under ${contactLimits.message} characters — we can go deeper in conversation.`;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
