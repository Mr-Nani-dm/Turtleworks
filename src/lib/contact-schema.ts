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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (value: unknown) =>
  typeof value === "string" ? value.replace(/\u0000/g, "").trim() : "";

/** Shared by the form (instant feedback) and the API (source of truth). */
export function validateContact(raw: Record<string, unknown>):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: ContactErrors } {
  const data: ContactInput = {
    name: text(raw.name),
    email: text(raw.email).toLowerCase(),
    company: text(raw.company),
    message: text(raw.message),
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
