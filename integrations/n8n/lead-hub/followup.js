// Follow-up rules: one polite nudge, then close out. Never more than one message.
//   - awaiting an answer + no reply for 24h  -> one follow-up (22h when the chat window is about to close)
//   - no reply for 72h                        -> mark Not Now and tell the team (no message to the customer)
// Customer messages only go out 09:00-21:00 IST.

const ROUTES = { general: "hello@turtleworks.in", projects: "projects@turtleworks.in" };
const PROJECT_SERVICES = ["Website design", "Business automation", "Dashboard / FinOps"];
const GRAPH = "https://graph.facebook.com/v21.0";
const WA_PHONE_NUMBER_ID = "__WA_PHONE_NUMBER_ID__";
const FOLLOWUP_TEMPLATE = "tw_followup";
const TEMPLATE_LANG = "en";
const AWAITING = ["Auto Reply Sent", "Questionnaire Started"];
const HOUR = 3600e3;

const ist = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 16).replace("T", " ");
const firstOf = (n) => (String(n || "").split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "").slice(0, 40) || "there";

const now = Date.now();
const istHour = new Date(now + 330 * 60000).getUTCHours();
const daytime = istHour >= 9 && istHour < 21;

const followText = (first) =>
  `Hi ${first}, just checking in. Happy to continue whenever suits you. Just reply here and we'll pick up where we left off.`;

const alertFor = (r, label, next) => {
  const service = r["Service Interest"] || "Unspecified";
  return {
    to: PROJECT_SERVICES.includes(r["Service Interest"]) ? ROUTES.projects : ROUTES.general,
    subject: `${label}: ${r.Priority || "Cold"} ${service} Lead - ${r.Name || r.Phone || r.Email || r["Lead ID"]}`,
    body: [
      `Lead ID: ${r["Lead ID"]}`,
      `Source: ${r.Source} (${r.Channel})`,
      `Name: ${r.Name || "n/a"}`,
      `Phone: ${r.Phone || "n/a"}`,
      `Email: ${r.Email || "n/a"}`,
      `Service Interest: ${service}`,
      `Business Type: ${r["Business Type"] || "n/a"}`,
      `Requirement Summary: ${r["Requirement Summary"] || "n/a"}`,
      `Status: ${r.Status}`,
      `Priority: ${r.Priority || "Cold"}`,
      `Next Action: ${next}`,
      "",
      "Conversation Summary:",
      r["Conversation Summary"] || "n/a",
    ].join("\n"),
  };
};

const out = [];
for (const { json: r } of $input.all()) {
  if (!r["Lead ID"] || String(r["Automation Paused"]) === "Yes" || !AWAITING.includes(r.Status)) continue;
  const lastIn = Number(r["Last Inbound Ms"]);
  if (!lastIn) continue;

  const fu = Number(r["Follow-up Count"]) || 0;
  const hrs = (now - lastIn) / HOUR;
  const chatWin = Number(r["Chat Window Ms"]) || 0;
  const windowOpen = chatWin > 0 && now - chatWin < 23 * HOUR;
  const channel = r.Channel;
  const inWindowChat = windowOpen && (channel === "WhatsApp" || channel === "Instagram" || channel === "Facebook");

  if (hrs >= 72) {
    const row = { ...r, Status: "Not Now", "Next Follow-up Date": "" };
    out.push({ json: { action: "not_now", has_send: false, row, send: null, has_alert: true, alert: alertFor(row, "Not Now", "No reply for 3 days, so the lead was marked Not Now. Consider a personal follow-up.") } });
    continue;
  }
  if (fu >= 1 || !daytime || hrs < (inWindowChat ? 22 : 24)) continue;

  const first = firstOf(r.Name);
  let send = null;
  let manual = false;
  if (channel === "WhatsApp") {
    const to = String(r.Phone).replace(/\D/g, "");
    const url = `${GRAPH}/${WA_PHONE_NUMBER_ID}/messages`;
    send = windowOpen
      ? { via: "whatsapp", url, body: { messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: followText(first) } } }
      : {
          via: "whatsapp",
          url,
          body: { messaging_product: "whatsapp", to, type: "template", template: { name: FOLLOWUP_TEMPLATE, language: { code: TEMPLATE_LANG }, components: [{ type: "body", parameters: [{ type: "text", text: first }] }] } },
        };
  } else if (channel === "Instagram" || channel === "Facebook") {
    if (windowOpen) send = { via: "dm", url: `${GRAPH}/me/messages`, body: { recipient: { id: String(r["Channel ID"]) }, messaging_type: "RESPONSE", message: { text: followText(first) } } };
    else manual = true;
  } else if (channel === "Email" && r["Last Message ID"]) {
    send = { via: "email", to: r.Email, subject: "Following up", message: `${followText(first)}\n\nTurtleWorks\nhttps://www.turtleworks.in`, message_id: String(r["Last Message ID"]) };
  } else {
    manual = true;
  }

  const stamp = ist(now).slice(5);
  const line = `[${stamp}] Bot: ${manual ? "follow-up needed (could not send automatically)" : send.body?.template ? "(WhatsApp follow-up template)" : "follow-up sent"}`;
  const row = {
    ...r,
    "Follow-up Count": 1,
    "Next Follow-up Date": ist(lastIn + 72 * HOUR),
    "Conversation Summary": [r["Conversation Summary"], line].filter(Boolean).join("\n").slice(-2400),
    ...(send ? { "Last Contacted": ist(now), "Last Contacted Ms": now } : {}),
  };
  out.push({
    json: {
      action: manual ? "manual" : "followup",
      has_send: Boolean(send),
      row,
      row_failed: { ...r, Notes: [r.Notes, `Follow-up failed ${ist(now)} IST`].filter(Boolean).join(" | ") },
      send,
      has_alert: manual,
      alert: manual ? alertFor(row, "Follow-up needed", "The customer's chat window has closed, so a follow-up could not be sent automatically. Contact them personally.") : null,
    },
  });
}
return out;
