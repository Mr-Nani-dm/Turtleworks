const fs = require("fs");
const path = require("path");
const COLUMNS = require("./columns.json");

const load = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
function exec(file, input, named = {}, now = Date.now(), src) {
  const realNow = Date.now;
  Date.now = () => now;
  try {
    const $input = { all: () => input.map((json) => ({ json })) };
    const $ = (n) => ({ all: () => (named[n] || []).map((json) => ({ json })) });
    return new Function("$input", "$", src ?? load(file))($input, $).map((i) => i.json);
  } finally {
    Date.now = realNow;
  }
}

let pass = 0;
let fail = 0;
const t = (name, cond, detail = "") => {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL:", name, detail);
  }
};

const NOW = Date.UTC(2026, 8, 30, 6, 30); // 12:00 IST
const wa = (text, id, from = "918499989116", extra = {}) => ({
  body: { object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, contacts: [{ wa_id: from, profile: { name: "Ravi Kumar" } }], messages: [{ from, id, timestamp: String(NOW / 1000), type: "text", text: { body: text }, ...extra }] } }] }] },
});
const normalise = (items) => exec("normalise.js", items, {}, NOW);

// ── normaliser ────────────────────────────────────────────────────────────────
let n = normalise([wa("Hi", "wamid.1")]);
t("wa: one item", n.length === 1);
t("wa: fields", n[0].channel === "WhatsApp" && n[0].phone === "918499989116" && n[0].lookup_key === "phone:918499989116" && n[0].name === "Ravi Kumar" && n[0].first_name === "Ravi", JSON.stringify(n[0]));
t("wa: status callback ignored", normalise([{ body: { object: "whatsapp_business_account", entry: [{ changes: [{ value: { statuses: [{ id: "x", status: "delivered" }] } }] }] } }]).length === 0);
t("wa: reaction ignored", normalise([wa("", "wamid.r", "918499989116", { type: "reaction", reaction: { emoji: "x" } })]).length === 0);
n = normalise([wa("", "wamid.img", "918499989116", { type: "image", image: {} })]);
t("wa: media has media_type", n[0].media_type === "image" && n[0].text === "");
n = normalise([{ body: { object: "instagram", entry: [{ id: "p", messaging: [{ sender: { id: "IG1" }, timestamp: NOW, message: { mid: "m1", text: "hello" } }, { sender: { id: "p" }, message: { mid: "m2", text: "echo", is_echo: true } }] }] } }]);
t("ig: echo dropped, message kept", n.length === 1 && n[0].lookup_key === "ig:IG1" && n[0].channel === "Instagram");
n = normalise([{ body: { object: "page", entry: [{ id: "p", messaging: [{ sender: { id: "FB1" }, message: { mid: "m3", text: "hi" } }] }] } }]);
t("fb: parsed", n.length === 1 && n[0].channel === "Facebook" && n[0].lookup_key === "fb:FB1");
n = normalise([{ id: "g1", threadId: "t1", From: "Priya S <priya@shop.in>", Subject: "Website for my shop", text: "I need a website.\n\nOn Tue, 29 Sep 2026 at 10:00, Team <hello@turtleworks.in> wrote:\n> old" }]);
t("gmail: parsed + quote stripped", n.length === 1 && n[0].email === "priya@shop.in" && n[0].name === "Priya S" && n[0].text === "I need a website." && n[0].thread_id === "t1", JSON.stringify(n[0]));
t("gmail: noreply ignored", normalise([{ id: "g2", threadId: "t", From: "noreply@x.com", Subject: "Hi", text: "x" }]).length === 0);
t("gmail: own domain ignored", normalise([{ id: "g3", threadId: "t", From: "Team <hello@turtleworks.in>", Subject: "Hi", text: "x" }]).length === 0);
t("gmail: our own TW notification ignored", normalise([{ id: "g4", threadId: "t", From: "a@b.in", Subject: "[TW-20260929-AB12] New enquiry", text: "x" }]).length === 0);
t("gmail: auto-reply ignored", normalise([{ id: "g5", threadId: "t", From: "a@b.in", Subject: "Automatic reply: hi", text: "x" }]).length === 0);
n = normalise([{ lead_id: "TW-20260929-AB12", name: "Asha M", email: "Asha@Shop.in", phone: "8499989116", company: "Asha Bakes", message: "Need a website for my bakery", received_at: new Date(NOW).toISOString() }]);
t("website: phone normalised + key", n[0].phone === "918499989116" && n[0].lookup_key === "phone:918499989116" && n[0].email === "asha@shop.in", JSON.stringify(n[0]));
n = normalise([{ lead_id: "TW-X", name: "Asha M", email: "asha@shop.in", message: "hello" }]);
t("website: no phone -> email key", n[0].lookup_key === "email:asha@shop.in" && n[0].phone === "");

// ── engine ────────────────────────────────────────────────────────────────────
const engine = (inbound, prev, now = NOW) => exec("engine.js", prev ? [prev] : [], { "Tag prospect replies": [inbound] }, now)[0];
const inb = (o) => normalise([o])[0];
const asRow = (d) => ({ ...d.row });

// full WhatsApp conversation
let d = engine(inb(wa("Hi TurtleWorks, I'd like to talk about a problem in my business.", "m1")), null);
t("new wa lead: welcome menu", d.send.via === "whatsapp" && d.send.body.text.body.includes("1. Website design") && d.send.body.text.body.startsWith("Hi Ravi, welcome to TurtleWorks."), JSON.stringify(d.send));
t("new wa lead: row", d.row.Status === "Auto Reply Sent" && d.row.Step === 1 && d.row["Lead Type"] === "Inbound" && d.row.Campaign === "Website WhatsApp button" && d.row.Owner === "Narendra");
t("new wa lead: alert to general (service unknown)", d.alert && d.alert.to === "hello@turtleworks.in" && d.alert.subject === "New Cold Unspecified Lead - Ravi Kumar", d.alert && d.alert.subject);
t("row has exactly the CRM columns", JSON.stringify(Object.keys(d.row).sort()) === JSON.stringify([...COLUMNS].sort()), Object.keys(d.row).filter((k) => !COLUMNS.includes(k)).concat(COLUMNS.filter((k) => !(k in d.row))).join());
t("Last Contacted set once a reply is queued", d.row["Last Contacted Ms"] === NOW && d.row["Next Follow-up Date"] === "2026-10-01 12:00", d.row["Next Follow-up Date"]);
t("failed send keeps state and flags note", d.row_failed.Status === "New Lead" && d.row_failed.Step === 0 && /failed/.test(d.row_failed.Notes) && d.row_failed["Last Contacted Ms"] === "");

let row = asRow(d);
let step = (text, id) => {
  const r = engine(inb(wa(text, id)), row);
  row = asRow(r);
  return r;
};
d = step("2", "m2");
t("choice 2 -> automation, asks business type", row["Service Interest"] === "Business automation" && row.Status === "Questionnaire Started" && row.Step === 2 && d.send.body.text.body === "What type of business do you run?");
t("no alert on intermediate step", d.alert === null);
d = step("Bakery with 3 outlets", "m3");
t("business type stored, Warm, asks setup", row["Business Type"] === "Bakery with 3 outlets" && row.Priority === "Warm" && d.send.body.text.body === "Do you already have a website or system?");
d = step("yes we have a small site", "m4");
t("'yes' to setup question does NOT make Hot", row.Priority === "Warm" && d.send.body.text.body === "What is the main issue you want to fix?");
d = step("Invoices are made by hand every week", "m5");
t("issue captured + timeline question", /Main issue: Invoices/.test(row["Requirement Summary"]) && d.send.body.text.body === "How soon do you want to start?" && d.alert === null);
d = step("next month", "m6");
t("timeline -> urgency Medium + call question", row.Urgency === "Medium" && d.send.body.text.body === "Would you like a quick 10-minute call?");
const beforeCall = { ...row };
d = step("yes please", "m7");
t("yes to call -> Call Requested, Hot, paused", row.Status === "Call Requested" && row.Priority === "Hot" && row["Automation Paused"] === "Yes", JSON.stringify([row.Status, row.Priority, row["Automation Paused"]]));
t("call alert routed to projects (+accounts for the invoice mention)", d.alert.to.includes("projects@turtleworks.in") && d.alert.to.includes("accounts@turtleworks.in") && d.alert.subject === "Call requested: Hot Business automation Lead - Ravi Kumar", d.alert.subject + " | " + d.alert.to);
t("alert body has the required fields", ["Lead ID:", "Source:", "Name:", "Phone:", "Email:", "Service Interest:", "Business Type:", "Requirement Summary:", "Status:", "Next Action:", "Conversation Summary:"].every((k) => d.alert.body.includes(k)));
t("no follow-up scheduled once paused", row["Next Follow-up Date"] === "");
d = step("what would it cost?", "m8");
t("while paused: no automated reply, team alerted", d.send === null && d.alert.subject.startsWith("Customer replied:") && row.Status === "Call Requested");

// no-call path
row = { ...beforeCall };
d = step("no thanks", "n7");
t("no call -> Qualified, Warm, not paused", row.Status === "Qualified" && row.Priority === "Warm" && row["Automation Paused"] === "No" && d.alert.subject.startsWith("Qualified:"));
d = step("ok great", "n8");
t("after qualified: bot stays quiet, team told", d.send === null && d.alert.subject.startsWith("Customer replied:"));

// pricing early -> Hot + alert, never downgraded
row = { ...beforeCall, Step: 2, Status: "Questionnaire Started", Priority: "Cold", "Automation Paused": "No" };
d = step("first tell me the pricing", "p1");
t("pricing question -> Hot and alerted", row.Priority === "Hot" && d.alert.subject.startsWith("Hot lead:"), d.alert && d.alert.subject);
row = { ...row, Step: 6 };
d = step("no", "p2");
t("priority never downgrades", row.Priority === "Hot" && row.Status === "Qualified");

// service choice by words / unclear
row = { ...beforeCall, Step: 1, Status: "Auto Reply Sent", "Service Interest": "" };
d = step("i need a dashboard for cloud costs", "s1");
t("free-text service detection", row["Service Interest"] === "Dashboard / FinOps");
row = { ...beforeCall, Step: 1, Status: "Auto Reply Sent", "Service Interest": "" };
d = step("hmm?", "s2");
t("unclear -> Not sure + gentle question", row["Service Interest"] === "Not sure" && d.send.body.text.body.startsWith("No problem"));

// duplicate delivery (Meta retries)
const dupRow = { ...beforeCall, "Last Message ID": "dup-1" };
t("duplicate message id skipped", engine(inb(wa("hello", "dup-1")), dupRow).skip === true);

// opt-out
d = engine(inb(wa("STOP", "o1")), { ...beforeCall, Step: 3 });
t("STOP -> Not Now, paused, confirmation only", d.row.Status === "Not Now" && d.row["Automation Paused"] === "Yes" && d.send.body.text.body.startsWith("Understood") && d.alert.subject.startsWith("Opted out:"));

// media
d = engine(inb(wa("", "img1", "918499989116", { type: "audio", audio: {} })), { ...beforeCall, Step: 3 });
t("voice note -> Needs Human Review, no reply", d.row.Status === "Needs Human Review" && d.row["Automation Paused"] === "Yes" && d.send === null);

// human statuses pause automation
for (const s of ["Proposal Drafted", "Payment Pending"]) {
  const r = engine(inb(wa("hello?", "h" + s)), { ...beforeCall, Status: s, "Automation Paused": "Yes" });
  t(`${s}: no automated message`, r.send === null && r.has_alert);
}
d = engine(inb(wa("hi again", "back1")), { ...beforeCall, Status: "Not Now", Step: 3, "Automation Paused": "No" });
t("returns after Not Now -> human review", d.row.Status === "Needs Human Review" && d.send === null);

// website leads
const site = (o) => ({ lead_id: "TW-20260929-AB12", name: "Asha M", email: "asha@shop.in", company: "Asha Bakes", message: "We need a new website for our bakery and online orders.", received_at: new Date(NOW).toISOString(), ...o });
d = engine(inb(site({ phone: "8499989116" })), null);
t("website + phone -> WhatsApp welcome template", d.send.via === "whatsapp" && d.send.body.type === "template" && d.send.body.template.name === "tw_welcome" && d.send.body.template.components[0].parameters[0].text === "Asha" && d.send.body.to === "918499989116", JSON.stringify(d.send));
t("website lead: Warm, guessed service, routed to projects", d.row.Priority === "Warm" && d.row["Service Interest"] === "Website design" && d.alert.to === "projects@turtleworks.in" && d.row.Channel === "WhatsApp" && d.row.Source === "Website form" && d.row["Lead ID"] === "TW-20260929-AB12");
d = engine(inb(site({})), null);
t("website, email only -> no message (TW-01 already acknowledged), team alerted", d.send === null && d.row.Status === "New Lead" && d.row.Step === 0 && d.alert.subject.startsWith("New Warm Website design Lead"), JSON.stringify([d.send, d.row.Status, d.alert && d.alert.subject]));
const siteRow = asRow(d);
d = engine(inb(site({ lead_id: "TW-20260930-ZZ99", message: "Any update?" })), siteRow);
t("same person enquires again -> merged, no message", d.send === null && d.row["Lead ID"] === "TW-20260929-AB12" && /Any update/.test(d.row["Requirement Summary"]) && d.alert.subject.startsWith("Repeat enquiry:"));
d = engine(inb({ id: "g9", threadId: "t9", From: "Asha M <asha@shop.in>", Subject: "Re: your enquiry", text: "Can you call me tomorrow?" }), siteRow);
t("email-only website lead replying by email: human conversation, Hot, no bot", d.send === null && d.row.Priority === "Hot" && d.alert !== null);

// email
d = engine(inb({ id: "g10", threadId: "t10", From: "Vikram <vik@clinic.in>", Subject: "Need a website", text: "Hello, we need a website for our clinic." }), null);
t("new email lead -> threaded email reply with menu", d.send.via === "email" && d.send.to === "vik@clinic.in" && d.send.subject === "Re: Need a website" && d.send.message_id === "g10" && d.send.message.includes("5. Not sure, need guidance") && d.row.Channel === "Email" && d.row["Thread ID"] === "t10");

// instagram
d = engine(inb({ body: { object: "instagram", entry: [{ id: "p", messaging: [{ sender: { id: "IG7" }, timestamp: NOW, message: { mid: "ig-m", text: "hi" } }] }] } }), null);
t("instagram lead -> DM reply", d.send.via === "dm" && d.send.body.recipient.id === "IG7" && d.send.url.endsWith("/me/messages") && d.row["Channel ID"] === "IG7");

// payment / support routing
d = engine(inb(wa("I am an existing client, the site is down and I need the invoice", "e1")), null);
t("support + payment keywords route to all relevant inboxes", d.alert.to.includes("support@turtleworks.in") && d.alert.to.includes("accounts@turtleworks.in") && d.alert.subject.startsWith("Attention needed:"), d.alert.to + " | " + d.alert.subject);
t("budget extracted", engine(inb(wa("budget is around 5 lakhs", "b1")), null).row["Budget Range"] === "5 lakhs");

// prospect replies belong to the outbound handler (TW-11), never to the hub
const flagged = { ...inb(wa("YES", "px1")), outbound_reply: true };
const normal = { ...inb(wa("hello", "px2", "919111111111")), outbound_reply: false };
const routed = exec("engine.js", [], { "Tag prospect replies": [flagged, normal] }, NOW);
t("hub ignores flagged prospect replies and still handles real leads", routed.length === 1 && routed[0].row["Lookup Key"] === "phone:919111111111", JSON.stringify(routed.map((x) => x.row && x.row["Lookup Key"])));

// ── follow-up ────────────────────────────────────────────────────────────────
const fu = (rows, now = NOW) => exec("followup.js", rows, {}, now);
const H = 3600e3;
const base = (o) => ({
  "Lead ID": "WA-1", Name: "Ravi Kumar", Phone: "+918499989116", Email: "", Source: "WhatsApp", Channel: "WhatsApp", Status: "Auto Reply Sent",
  Priority: "Cold", "Service Interest": "", "Automation Paused": "No", "Follow-up Count": 0, "Conversation Summary": "x", "Channel ID": "918499989116",
  "Last Inbound Ms": NOW - 25 * H, "Chat Window Ms": NOW - 25 * H, "Last Message ID": "m", Notes: "", ...o,
});
let f = fu([base({})]);
t("wa 25h, window closed -> follow-up template", f.length === 1 && f[0].action === "followup" && f[0].send.body.type === "template" && f[0].send.body.template.name === "tw_followup" && f[0].row["Follow-up Count"] === 1, JSON.stringify(f[0] && f[0].send));
f = fu([base({ "Last Inbound Ms": NOW - 22.5 * H, "Chat Window Ms": NOW - 22.5 * H })]);
t("wa 22.5h, window still open -> free text follow-up", f.length === 1 && f[0].send.body.type === "text" && f[0].send.body.text.body.startsWith("Hi Ravi, just checking in"));
t("no follow-up before 22h", fu([base({ "Last Inbound Ms": NOW - 20 * H, "Chat Window Ms": NOW - 20 * H })]).length === 0);
t("no follow-up at 23h for a template-only (website) lead", fu([base({ "Last Inbound Ms": NOW - 23 * H, "Chat Window Ms": "" })]).length === 0);
t("website lead (no chat window) follows up at 24h with template", fu([base({ "Last Inbound Ms": NOW - 24.5 * H, "Chat Window Ms": "" })])[0].send.body.type === "template");
t("only one follow-up", fu([base({ "Follow-up Count": 1, "Last Inbound Ms": NOW - 40 * H })]).length === 0);
f = fu([base({ "Follow-up Count": 1, "Last Inbound Ms": NOW - 73 * H })]);
t("72h -> Not Now + team alert, no customer message", f.length === 1 && f[0].action === "not_now" && f[0].send === null && f[0].row.Status === "Not Now" && f[0].alert.subject.startsWith("Not Now:"));
f = fu([base({ "Follow-up Count": 0, "Last Inbound Ms": NOW - 80 * H })]);
t("72h with missed follow-up -> Not Now", f[0].action === "not_now");
const NIGHT = Date.UTC(2026, 8, 30, 21, 30); // 03:00 IST
t("quiet hours: no customer message", fu([base({ "Last Inbound Ms": NIGHT - 25 * H, "Chat Window Ms": NIGHT - 25 * H })], NIGHT).length === 0);
t("quiet hours: Not Now marking still allowed", fu([base({ "Last Inbound Ms": NIGHT - 75 * H })], NIGHT)[0].action === "not_now");
t("paused leads left alone", fu([base({ "Automation Paused": "Yes" })]).length === 0);
t("Call Requested (human) left alone", fu([base({ Status: "Call Requested" })]).length === 0);
f = fu([base({ Channel: "Instagram", "Channel ID": "IG9", "Last Inbound Ms": NOW - 22.5 * H, "Chat Window Ms": NOW - 22.5 * H })]);
t("instagram in window -> DM follow-up", f[0].send.via === "dm" && f[0].send.body.recipient.id === "IG9");
f = fu([base({ Channel: "Instagram", "Channel ID": "IG9", "Last Inbound Ms": NOW - 26 * H, "Chat Window Ms": NOW - 26 * H })]);
t("instagram window closed -> manual alert, no send", f[0].action === "manual" && f[0].send === null && f[0].has_alert && f[0].row["Follow-up Count"] === 1);
f = fu([base({ Channel: "Email", Email: "vik@clinic.in", Phone: "", "Last Message ID": "g10", "Last Inbound Ms": NOW - 25 * H, "Chat Window Ms": NOW - 25 * H })]);
t("email lead -> threaded email follow-up", f[0].send.via === "email" && f[0].send.to === "vik@clinic.in" && f[0].send.message_id === "g10");
f = fu([base(Object.fromEntries(COLUMNS.map((c) => [c, ""])))]);
t("follow-up leaves a row with no lead id alone", f.length === 0);
f = fu([base({ Notes: "kept", "Created Date": "2026-09-29 10:00" })]);
t("follow-up writes back the whole row (nothing blanked)", f.length === 1 && f[0].row.Notes === "kept" && f[0].row["Created Date"] === "2026-09-29 10:00" && f[0].row_failed["Created Date"] === "2026-09-29 10:00");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
