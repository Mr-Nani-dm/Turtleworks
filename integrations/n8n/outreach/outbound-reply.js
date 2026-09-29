// Handles a prospect's WhatsApp reply. Safety first: an opt-out beats everything else, and a
// human is alerted whenever the reply is anything other than a clear yes / no.
// Never quotes a price, promises a result, or continues after NO or STOP.

const OWNER = "Narendra";
const ROUTES = { team: "projects@turtleworks.in", general: "hello@turtleworks.in" };
const GRAPH = "https://graph.facebook.com/v21.0";
const WA_PHONE_NUMBER_ID = "__WA_PHONE_NUMBER_ID__";

const MENU =
  "Great. To suggest the right direction, can you share what matters most right now?\n1. More enquiries\n2. Better website look\n3. Portfolio/trust\n4. Google ranking\n5. Automation/follow-up";
const FOCUS = ["More enquiries", "Better website look", "Portfolio/trust", "Google ranking", "Automation/follow-up"];
const NO_TEXT = "No problem. Thanks for replying. We won't follow up further.";
const PRICE_TEXT = "Pricing depends on scope, pages, content, and automation needs. We can quickly understand your requirement in a 10-minute call and suggest the right range.";
const CALL_TEXT = "Sure. Please share a preferred time for a quick 10-minute call.";
const CLOSE_TEXT = "Understood. Thanks for letting us know. You can message TurtleWorks anytime.";

const NO = /\b(stop|unsubscribe|not interested|not relevant|remove me|do not (?:contact|message|send)|don'?t (?:contact|message|send|call))\b|^\s*(?:no|nope|nah)\b/i;
const PRICE = /\b(price|pricing|cost|charges?|quote|quotation|how much|rates?|fees?)\b/i;
const CALL = /\b(call|phone|talk|speak|meeting|meet|connect)\b/i;
const YES = /\b(yes|yeah|yep|yup|interested|send|share|okay|ok|sure|please|go ahead)\b/i;
const STRONG_YES = /\b(interested|send|share|show|sample|see it)\b/i;
const HOLD = ["Human Review", "Call Requested", "Proposal Sent", "Won", "Lost", "Not Interested"];

const ist = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 16).replace("T", " ");
const one = (s, max) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const toPhone = (v) => {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = "91" + d;
  return d.length >= 11 && d.length <= 15 ? d : "";
};
const yes = (v) => ["yes", "true", "1", "y"].includes(String(v ?? "").trim().toLowerCase());
const add = (base, piece) => [base, piece].filter(Boolean).join(" | ").slice(0, 1800);

const NEXT = {
  yes: "Wait for their answer to the direction question, then prepare a short sample direction. Do not promise results.",
  price: "Reply personally. Ask about scope and offer the 10-minute call; do not quote a fixed price in chat.",
  call: "Confirm a time once they reply with a preferred slot.",
  call_time: "Confirm the call time with them personally.",
  direction: "Prepare a short sample direction for the focus they chose.",
  other: "Read the reply and answer personally. The bot has stopped messaging this prospect.",
  on_hold: "This prospect replied while a person owns the conversation. Reply personally.",
};
const LABEL = { yes: "Interested", price: "Price asked", call: "Call requested", call_time: "Call time received", direction: "Direction chosen", other: "Human review", on_hold: "Prospect replied" };

function classify(text, row) {
  const awaiting = String(row["Awaiting Reply"] || "");
  const owned = (HOLD.includes(row.Status) || row.Status === "Interested") && !awaiting;
  if (!text) return "other";
  if (NO.test(text)) return "no";
  if (owned) return "on_hold";
  if (PRICE.test(text)) return "price";
  if (awaiting === "call time") return "call_time";
  if (CALL.test(text)) return "call";
  if (awaiting === "direction") return "direction";
  if (row.Status === "Follow-up 2 Sent" && YES.test(text) && !STRONG_YES.test(text)) return "close_yes";
  if (YES.test(text)) return "yes";
  return "other";
}

const now = Date.now();
const rows = $input.all().map((i) => i.json).filter((r) => r["Prospect ID"]);
const out = [];

for (const { json: inbound } of $("Prospect reply (from TW-08)").all()) {
  const phone = inbound.phone;
  const mine = rows
    .filter((r) => toPhone(r.Phone) === phone && Number(r["First Sent Ms"]) > 0 && !yes(r["Do Not Contact"]))
    .sort((a, b) => Number(b["First Sent Ms"]) - Number(a["First Sent Ms"]));
  const target = mine[0];
  if (!target) {
    out.push({ json: { skip: true, reason: "no active outreach for this number" } });
    continue;
  }
  if (inbound.message_id && String(target["Last Message ID"]) === String(inbound.message_id)) {
    out.push({ json: { skip: true, reason: "duplicate message" } });
    continue;
  }

  const text = one(inbound.text, 1000);
  const outcome = inbound.media_type && !text ? "other" : classify(text, target);
  const stamp = ist(now).slice(5);
  let updated = { ...target };
  let reply = "";
  let alertKind = "";
  const set = (o) => (updated = { ...updated, ...o });

  set({
    "Last Contacted": ist(now),
    "Last Inbound Ms": Number(inbound.received_ms) || now,
    "Last Message ID": inbound.message_id || "",
    Owner: target.Owner || OWNER,
    "Lead Type": "Outbound",
    Notes: add(target.Notes, `[${stamp}] Prospect: ${text || `(${inbound.media_type || "no text"})`}`.slice(0, 260)),
  });

  if (outcome === "yes") {
    set({ "Reply Status": "YES", Status: "Interested", Priority: "Hot", "Awaiting Reply": "direction", "Next Follow-up Date": "" });
    reply = MENU;
    alertKind = "yes";
  } else if (outcome === "no") {
    set({ "Reply Status": "NO", Status: "Not Interested", "Do Not Contact": "Yes", "Awaiting Reply": "", "Next Follow-up Date": "" });
    reply = NO_TEXT;
  } else if (outcome === "close_yes") {
    set({ "Reply Status": "YES to close", Status: "Not Interested", "Do Not Contact": "Yes", "Awaiting Reply": "", "Next Follow-up Date": "" });
    reply = CLOSE_TEXT;
  } else if (outcome === "price") {
    set({ "Reply Status": "Price Asked", Status: "Human Review", Priority: "Hot", "Awaiting Reply": "", "Next Follow-up Date": "" });
    reply = PRICE_TEXT;
    alertKind = "price";
  } else if (outcome === "call") {
    set({ "Reply Status": "Call Requested", Status: "Call Requested", Priority: "Hot", "Awaiting Reply": "call time", "Next Follow-up Date": "" });
    reply = CALL_TEXT;
    alertKind = "call";
  } else if (outcome === "call_time") {
    set({ Notes: add(updated.Notes, `Preferred call time: ${text}`.slice(0, 200)), "Awaiting Reply": "" });
    alertKind = "call_time";
  } else if (outcome === "direction") {
    const pick = text.match(/^\s*(?:option\s*)?([1-5])\b/);
    const focus = pick ? FOCUS[Number(pick[1]) - 1] : text.slice(0, 120);
    set({ Notes: add(updated.Notes, `Focus: ${focus}`), "Awaiting Reply": "" });
    alertKind = "direction";
  } else if (outcome === "on_hold") {
    alertKind = "on_hold";
  } else {
    set({ "Reply Status": "Replied", Status: HOLD.includes(target.Status) ? target.Status : "Human Review", "Awaiting Reply": "", "Next Follow-up Date": "" });
    alertKind = "other";
  }
  if (reply) set({ "Last Message Sent": reply, "Last Sent Ms": now });

  const updates = [updated];
  if (updated["Do Not Contact"] === "Yes") {
    for (const r of rows) {
      if (r !== target && toPhone(r.Phone) === phone && !yes(r["Do Not Contact"])) {
        updates.push({ ...r, "Do Not Contact": "Yes", Status: r.Status === "Outreach Ready" ? "Do Not Contact" : r.Status, "Next Follow-up Date": "", Notes: add(r.Notes, `[${stamp}] Do Not Contact (asked to stop in another campaign)`) });
      }
    }
  }
  const failed = updates.map((u, i) => (i === 0 ? { ...u, "Send Error": "Send Failed" } : u));

  let alert = null;
  if (alertKind) {
    const t = updated;
    alert = {
      to: alertKind === "yes" ? `${ROUTES.team},${ROUTES.general}` : ROUTES.team,
      subject: `[Outreach] ${LABEL[alertKind]}: ${t["Business Name"] || t.Name} (${t["Campaign Name"] || "no campaign"})`,
      body: [
        `Prospect ID: ${t["Prospect ID"]}`,
        `Name: ${t.Name || "n/a"}`,
        `Business: ${t["Business Name"] || "n/a"}`,
        `Phone: ${t.Phone || "n/a"}`,
        `Niche: ${t.Niche || "n/a"}`,
        `Campaign: ${t["Campaign Name"] || "n/a"}`,
        `Reply: ${text || `(${inbound.media_type || "no text"})`}`,
        `Status: ${t.Status}`,
        `Suggested next action: ${NEXT[alertKind]}`,
      ].join("\n"),
    };
  }

  const send = reply ? { via: "whatsapp", url: `${GRAPH}/${WA_PHONE_NUMBER_ID}/messages`, body: { messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "text", text: { preview_url: false, body: reply } } } : null;
  out.push({
    json: {
      skip: false,
      outcome,
      has_send: Boolean(send),
      send,
      updates,
      updates_failed: failed,
      has_alert: Boolean(alert),
      alert,
      row: updated,
      log: { Timestamp: ist(now), "Prospect ID": updated["Prospect ID"], "Business Name": updated["Business Name"], Step: "reply", Result: outcome, Detail: `status=${updated.Status}; reply status=${updated["Reply Status"]}${send ? "; reply queued" : ""}` },
    },
  });

  const at = rows.indexOf(target);
  if (at >= 0) rows[at] = updated;
}
return out;
