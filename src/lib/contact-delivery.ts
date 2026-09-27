import "server-only";
import type { ContactInput } from "./contact-schema";

/*
  Server-only enquiry delivery. Configure ONE of:

  Webhook (n8n, Make, Zapier, Formspree…):
    CONTACT_WEBHOOK_URL      https endpoint receiving a JSON POST
    CONTACT_WEBHOOK_SECRET   optional, sent as the x-contact-secret header

  Email via Resend (https://resend.com):
    RESEND_API_KEY
    CONTACT_TO_EMAIL         inbox that receives enquiries
    CONTACT_FROM_EMAIL       verified sender, e.g. "TurtleWorks <site@yourdomain>"
*/

export type DeliveryMode = "webhook" | "resend";

const env = (key: string) => process.env[key]?.trim() || null;

export function getDeliveryMode(): DeliveryMode | null {
  if (env("CONTACT_WEBHOOK_URL")) return "webhook";
  if (env("RESEND_API_KEY") && env("CONTACT_TO_EMAIL")) return "resend";
  return null;
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 120);

export async function deliverEnquiry(
  enquiry: ContactInput,
  meta: { submittedAt: string; page: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const mode = getDeliveryMode();
  if (!mode) return { ok: false, reason: "not-configured" };

  const signal = AbortSignal.timeout(8000);

  try {
    if (mode === "webhook") {
      const secret = env("CONTACT_WEBHOOK_SECRET");
      const res = await fetch(env("CONTACT_WEBHOOK_URL")!, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(secret ? { "x-contact-secret": secret } : {}),
        },
        body: JSON.stringify({ ...enquiry, ...meta, source: "turtleworks-site" }),
        signal,
      });
      return res.ok ? { ok: true } : { ok: false, reason: `webhook-${res.status}` };
    }

    const lines = [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Company: ${enquiry.company || "—"}`,
      `Submitted: ${meta.submittedAt}`,
      "",
      enquiry.message,
    ];
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env("CONTACT_FROM_EMAIL") ?? "TurtleWorks <onboarding@resend.dev>",
        to: [env("CONTACT_TO_EMAIL")],
        reply_to: enquiry.email,
        subject: `New enquiry — ${oneLine(enquiry.name)}`,
        text: lines.join("\n"),
      }),
      signal,
    });
    return res.ok ? { ok: true } : { ok: false, reason: `resend-${res.status}` };
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network";
    return { ok: false, reason };
  }
}
