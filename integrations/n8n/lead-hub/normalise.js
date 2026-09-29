// Turns every inbound source into one shape. Emits 0..n items:
// status callbacks, echoes, reactions, our own mail and automated mail emit nothing.
const OWN_DOMAIN = "turtleworks.in";

const digits = (v) => String(v ?? "").replace(/\D/g, "");
const toPhone = (v) => {
  let d = digits(v);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = "91" + d;
  return d.length >= 11 && d.length <= 15 ? d : "";
};
const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
const firstName = (name) => (String(name).split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "").slice(0, 40);

const out = [];
const lookupKey = (o) =>
  o.phone ? `phone:${o.phone}` : o.channel === "Instagram" ? `ig:${o.sender_id}` : o.channel === "Facebook" ? `fb:${o.sender_id}` : `email:${o.email}`;
const push = (o) =>
  out.push({ json: { text: "", name: "", email: "", phone: "", ...o, lookup_key: lookupKey(o), first_name: firstName(o.name || "") || "there" } });

const parseFrom = (raw) => {
  const s = String(raw ?? "");
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: clean(m[1], 120), email: m[2].trim().toLowerCase() } : { name: "", email: s.trim().toLowerCase() };
};

const AUTOMATED_SENDER = /(no-?reply|do-?not-?reply|mailer-daemon|postmaster|notifications?@|bounce|newsletter|@.*\.(?:google|linkedin|facebookmail|instagram)\.com)/i;
const AUTOMATED_SUBJECT = /(undeliverable|delivery status|out of office|automatic reply|auto-?reply|unsubscribe|verify your|password reset|\[TW-)/i;

const stripQuoted = (t) =>
  String(t ?? "")
    .split(/\r?\n(?:On .{5,120} wrote:|-{2,}\s*Original Message|From:\s.+\r?\nSent:)/)[0]
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith(">"))
    .join("\n");

for (const { json: j } of $input.all()) {
  const body = j.body;

  if (body && body.object) {
    for (const entry of body.entry || []) {
      if (body.object === "whatsapp_business_account") {
        for (const change of entry.changes || []) {
          const v = change.value || {};
          for (const m of v.messages || []) {
            if (m.type === "reaction") continue;
            const contact = (v.contacts || []).find((c) => c.wa_id === m.from);
            const text =
              m.type === "text" ? m.text?.body
              : m.type === "button" ? m.button?.text
              : m.type === "interactive" ? m.interactive?.button_reply?.title || m.interactive?.list_reply?.title
              : "";
            push({
              channel: "WhatsApp",
              source: "WhatsApp",
              sender_id: m.from,
              phone: toPhone(m.from),
              name: clean(contact?.profile?.name, 120),
              text: clean(text, 4000),
              media_type: text ? "" : m.type || "unknown",
              message_id: m.id,
              received_ms: (Number(m.timestamp) || Date.now() / 1000) * 1000,
            });
          }
        }
      } else if (body.object === "instagram" || body.object === "page") {
        const channel = body.object === "instagram" ? "Instagram" : "Facebook";
        for (const ev of entry.messaging || []) {
          if (!ev.message || ev.message.is_echo) continue;
          const text = clean(ev.message.text, 4000);
          push({
            channel,
            source: channel,
            sender_id: ev.sender?.id,
            text,
            media_type: text ? "" : ev.message.attachments?.[0]?.type || "unknown",
            message_id: ev.message.mid,
            received_ms: Number(ev.timestamp) || Date.now(),
          });
        }
      }
    }
    continue;
  }

  if (j.lead_id) {
    push({
      channel: "Website",
      source: "Website form",
      lead_id: j.lead_id,
      name: clean(j.name, 120),
      email: clean(j.email, 254).toLowerCase(),
      phone: toPhone(j.phone),
      company: clean(j.company, 160),
      text: clean(j.message, 4000),
      topic_hint: j.topic_hint || "",
      source_page: j.source_page || "",
      message_id: j.lead_id,
      received_ms: j.received_at ? new Date(j.received_at).getTime() : Date.now(),
    });
    continue;
  }

  const rawFrom = j.from?.text ?? j.From ?? j.from ?? j.headers?.from ?? "";
  if (rawFrom || j.threadId) {
    const from = parseFrom(typeof rawFrom === "object" ? rawFrom.value?.[0]?.address || "" : rawFrom);
    const subject = clean(j.Subject ?? j.subject ?? j.headers?.subject, 200);
    if (!from.email || from.email.endsWith(`@${OWN_DOMAIN}`)) continue;
    if (AUTOMATED_SENDER.test(from.email) || AUTOMATED_SUBJECT.test(subject)) continue;
    push({
      channel: "Email",
      source: "Email",
      email: from.email,
      name: from.name || from.email.split("@")[0],
      subject,
      text: clean(stripQuoted(j.text ?? j.snippet ?? ""), 4000),
      thread_id: j.threadId || "",
      message_id: j.id || "",
      received_ms: j.internalDate ? Number(j.internalDate) : Date.now(),
    });
  }
}

return out;
