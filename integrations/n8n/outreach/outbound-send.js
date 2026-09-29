// Outbound WhatsApp outreach: decides who to message this run.
//   new outreach   Status = Outreach Ready, passes every check, within the daily caps
//   follow-up 1    48 h after the first message, no reply
//   follow-up 2    120 h after the first message, no reply
//   close out      168 h after the first message, no reply -> No Response, no more messages
// Runs Mon-Sat 10:00-18:00 IST only. Follow-ups go before new outreach. Never messages a
// Do Not Contact number, and never the same phone twice across campaigns.

const OWNER = "Narendra";
const CAPS = { firstTouchPerDay: 15, totalPerDay: 20, perRun: 3 };
const REQUIRE_CONTACT_BASIS = true;
const GRAPH = "https://graph.facebook.com/v21.0";
const WA_PHONE_NUMBER_ID = "__WA_PHONE_NUMBER_ID__";
const TEMPLATES = { initial: "tw_outreach_initial", fu1: "tw_outreach_fu1", fu2: "tw_outreach_fu2" };
const TEMPLATE_LANG = "en";
const HOUR = 3600e3;
const FOLLOWING = ["Outreach Sent", "Follow-up 1 Due", "Follow-up 1 Sent", "Follow-up 2 Due", "Follow-up 2 Sent"];
const CLAIMS = /\b(guarantee[sd]?|guaranteed|100\s?%|assured|number one|no\.?\s?1|#1|rank(?:s|ed)? first|double your|triple your|10x)\b/i;

const ist = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 16).replace("T", " ");
const one = (s, max) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max);
const firstOf = (n) => (String(n || "").split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "").slice(0, 40) || "there";
const toPhone = (v) => {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && /^[6-9]/.test(d)) d = "91" + d;
  return d.length >= 11 && d.length <= 15 ? d : "";
};
const yes = (v) => ["yes", "true", "1", "y"].includes(String(v ?? "").trim().toLowerCase());
const RANK = { Hot: 0, Warm: 1, Cold: 2 };

const texts = {
  initial: (name, note, biz) =>
    `Hi ${name}, this is Narendra from TurtleWorks.\n\nI noticed ${note}.\n\nFor ${biz}, a sharper website and WhatsApp enquiry flow could help turn more visitors into real leads.\n\nWould you like us to share a quick sample direction for your business?\n\nReply YES if you want to see it.\nReply NO if it's not relevant.`,
  fu1: (name, biz) =>
    `Hi ${name}, just checking once. Would you like a quick sample direction for ${biz}'s website/enquiry flow?\nYES - send it\nNO - not relevant`,
  fu2: (name) =>
    `Last follow-up from my side, ${name}. If improving your website or enquiry flow becomes relevant later, you can message TurtleWorks anytime. Should I close this for now?`,
};
const template = (to, name, params) => ({
  messaging_product: "whatsapp",
  to,
  type: "template",
  template: { name, language: { code: TEMPLATE_LANG }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] },
});

const now = Date.now();
const local = new Date(now + 330 * 60000);
const weekday = local.getUTCDay();
const hour = local.getUTCHours();
const windowOpen = weekday !== 0 && hour >= 10 && hour < 18;
const dayStart = Math.floor((now + 330 * 60000) / 86400000) * 86400000 - 330 * 60000;

const rows = $input.all().map((i) => i.json).filter((r) => r["Prospect ID"]);
const phoneOf = (r) => toPhone(r.Phone);
const dncPhones = new Set(rows.filter((r) => yes(r["Do Not Contact"]) || r.Status === "Do Not Contact").map(phoneOf).filter(Boolean));
const contacted = new Set(rows.filter((r) => Number(r["First Sent Ms"]) > 0).map(phoneOf).filter(Boolean));
const sentToday = rows.filter((r) => Number(r["Last Sent Ms"]) >= dayStart).length;
const firstToday = rows.filter((r) => Number(r["First Sent Ms"]) >= dayStart).length;
let totalLeft = Math.max(0, CAPS.totalPerDay - sentToday);
let firstLeft = Math.max(0, CAPS.firstTouchPerDay - firstToday);
let runLeft = CAPS.perRun;

const out = [];
const log = (r, step, result, detail) => ({ Timestamp: ist(now), "Prospect ID": r["Prospect ID"], "Business Name": r["Business Name"], Step: step, Result: result, Detail: detail });
const emit = (action, row, extra = {}) =>
  out.push({ json: { action, has_send: Boolean(extra.send), row, row_failed: null, send: null, log: log(row, extra.step || action, extra.result || action, extra.detail || row.Status), ...extra } });

const send = (r, stage) => {
  const to = phoneOf(r);
  const name = firstOf(r.Name);
  const biz = one(r["Business Name"], 80);
  const first = Number(r["First Sent Ms"]) || now;
  const url = `${GRAPH}/${WA_PHONE_NUMBER_ID}/messages`;
  const base = { ...r, Owner: r.Owner || OWNER, "Lead Type": "Outbound", "Last Contacted": ist(now), "Last Sent Ms": now, "Send Error": "" };
  const row_failed = {
    ...r,
    Owner: r.Owner || OWNER,
    "Lead Type": "Outbound",
    Status: "Human Review",
    "Send Error": "Send Failed",
    Notes: [r.Notes, `${ist(now)} send failed (${stage})`].filter(Boolean).join(" | "),
  };
  if (stage === "initial") {
    const note = one(r["Personalization Note"], 200).replace(/[.\s]+$/, "");
    return {
      send: { via: "whatsapp", url, body: template(to, TEMPLATES.initial, [name, note, biz]) },
      row: { ...base, Status: "Outreach Sent", "Reply Status": "Awaiting", "Last Message Sent": texts.initial(name, note, biz), "Next Follow-up Date": ist(now + 48 * HOUR), "First Sent Ms": now, "Follow-up Count": 0, Priority: r.Priority || "Cold" },
      row_failed,
    };
  }
  if (stage === "fu1") {
    return {
      send: { via: "whatsapp", url, body: template(to, TEMPLATES.fu1, [name, biz]) },
      row: { ...base, Status: "Follow-up 1 Sent", "Last Message Sent": texts.fu1(name, biz), "Next Follow-up Date": ist(first + 120 * HOUR), "Follow-up Count": 1 },
      row_failed,
    };
  }
  return {
    send: { via: "whatsapp", url, body: template(to, TEMPLATES.fu2, [name]) },
    row: { ...base, Status: "Follow-up 2 Sent", "Last Message Sent": texts.fu2(name), "Next Follow-up Date": ist(first + 168 * HOUR), "Follow-up Count": 2 },
    row_failed,
  };
};

// 1. Follow-ups and close-outs (oldest first)
const follow = rows
  .filter((r) => FOLLOWING.includes(r.Status) && !yes(r["Do Not Contact"]) && !Number(r["Last Inbound Ms"]) && Number(r["First Sent Ms"]) > 0)
  .sort((a, b) => Number(a["First Sent Ms"]) - Number(b["First Sent Ms"]));
for (const r of follow) {
  const hrs = (now - Number(r["First Sent Ms"])) / HOUR;
  const fu = Number(r["Follow-up Count"]) || 0;
  if (hrs >= 168) {
    emit("no_response", { ...r, Status: "No Response", "Reply Status": "No Reply", "Next Follow-up Date": "" }, { result: "no response after 7 days" });
    continue;
  }
  const stage = hrs >= 120 && fu < 2 ? "fu2" : hrs >= 48 && fu < 1 ? "fu1" : null;
  if (!stage) continue;
  if (windowOpen && totalLeft > 0 && runLeft > 0) {
    const s = send(r, stage);
    emit(stage, s.row, { send: s.send, row_failed: s.row_failed, result: `${stage} queued` });
    totalLeft--;
    runLeft--;
  } else {
    const due = stage === "fu1" ? "Follow-up 1 Due" : "Follow-up 2 Due";
    if (r.Status !== due) emit("due", { ...r, Status: due }, { result: `${stage} due`, detail: windowOpen ? "daily cap reached" : "outside sending window" });
  }
}

// 2. New outreach
const reject = (r, reason) => emit("rejected", { ...r, Status: "Human Review", "Send Error": reason, Notes: [r.Notes, `${ist(now)} not sent: ${reason}`].filter(Boolean).join(" | ") }, { result: "not sent", detail: reason });
const ready = rows
  .filter((r) => r.Status === "Outreach Ready")
  .sort((a, b) => (RANK[a.Priority] ?? 3) - (RANK[b.Priority] ?? 3));
const claimedNow = new Set();
for (const r of ready) {
  const phone = phoneOf(r);
  if (!phone) { reject(r, "Invalid or missing phone number"); continue; }
  if (dncPhones.has(phone)) { reject(r, "This number is on the Do Not Contact list"); continue; }
  if (contacted.has(phone) || claimedNow.has(phone)) { reject(r, "This number was already contacted in another row or campaign"); continue; }
  if (REQUIRE_CONTACT_BASIS && !one(r["Contact Basis"], 200)) { reject(r, "Contact Basis is empty (why is it OK to message this business?)"); continue; }
  if (one(r["Personalization Note"], 200).length < 15 || !one(r["Business Name"], 80)) { reject(r, "Personalization Note (15+ characters) and Business Name are required"); continue; }
  if (CLAIMS.test(r["Personalization Note"])) { reject(r, "Personalization Note contains a guarantee or result claim"); continue; }
  if (!windowOpen || totalLeft <= 0 || firstLeft <= 0 || runLeft <= 0) continue;
  const s = send(r, "initial");
  emit("initial", s.row, { send: s.send, row_failed: s.row_failed, result: "outreach queued" });
  claimedNow.add(phone);
  totalLeft--;
  firstLeft--;
  runLeft--;
}

return out;
