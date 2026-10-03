import { readFileSync } from "node:fs";

const load = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const COLUMNS = JSON.parse(load("prospect-columns.json"));

function exec(file, input, named = {}, now) {
  const realNow = Date.now;
  Date.now = () => now;
  try {
    const $input = { all: () => input.map((json) => ({ json })) };
    const $ = (n) => ({ all: () => (named[n] || []).map((json) => ({ json })) });
    return new Function("$input", "$", load(file))($input, $).map((i) => i.json);
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

const H = 3600e3;
const WED_NOON = Date.UTC(2026, 8, 30, 6, 30); // Wed 30 Sep 2026, 12:00 IST
const at = (d, h, m = 0) => Date.UTC(2026, 8, d, h, m) - 330 * 60000; // IST wall clock -> ms
t("test date is a weekday", new Date(WED_NOON + 330 * 60000).getUTCDay() === 3);

const P = (o = {}) => ({
  "Prospect ID": "P1", Name: "Rahul Sharma", "Business Name": "Sharma Interiors", Phone: "9876543210", Niche: "Interior designers",
  "Campaign Name": "Interior Designers - Hyderabad", "Personalization Note": "your portfolio page has great photos but no enquiry button.",
  "Lead Type": "Outbound", Status: "Outreach Ready", Priority: "Warm", "Contact Basis": "Public business listing", "Do Not Contact": "", Notes: "",
  "First Sent Ms": "", "Last Sent Ms": "", "Last Inbound Ms": "", "Follow-up Count": "", ...o,
});
const send = (rows, now = WED_NOON) => exec("outbound-send.js", rows, {}, now);

// ── sender: new outreach ──────────────────────────────────────────────────────
let r = send([P()]);
t("ready prospect -> template send", r.length === 1 && r[0].has_send && r[0].send.body.template.name === "tw_outreach_initial" && r[0].send.body.to === "919876543210", JSON.stringify(r[0] && r[0].send));
const params = r[0].send.body.template.components[0].parameters.map((p) => p.text);
t("personalised with first name, note (no trailing dot) and business", params[0] === "Rahul" && params[1] === "your portfolio page has great photos but no enquiry button" && params[2] === "Sharma Interiors", JSON.stringify(params));
t("row after send", r[0].row.Status === "Outreach Sent" && r[0].row["Reply Status"] === "Awaiting" && r[0].row["First Sent Ms"] === WED_NOON && r[0].row["Next Follow-up Date"] === "2026-10-02 12:00" && r[0].row.Owner === "Narendra" && r[0].row["Lead Type"] === "Outbound");
t("Last Message Sent is the exact approved copy", r[0].row["Last Message Sent"] === "Hi Rahul, this is Narendra from TurtleWorks.\n\nI noticed your portfolio page has great photos but no enquiry button.\n\nFor Sharma Interiors, a sharper website and WhatsApp enquiry flow could help turn more visitors into real leads.\n\nWould you like us to share a quick sample direction for your business?\n\nReply YES if you want to see it.\nReply NO if it's not relevant.");
t("failed send never leaves the prospect marked as contacted", r[0].row_failed.Status === "Human Review" && r[0].row_failed["Send Error"] === "Send Failed" && r[0].row_failed["First Sent Ms"] === "");
t("template params carry no line breaks", params.every((p) => !/[\r\n\t]/.test(p)));
r = send([P({ "Personalization Note": "your page\nhas great\n\nphotos, but no enquiry button" })]);
t("newlines in the note are flattened", !/\n/.test(r[0].send.body.template.components[0].parameters[1].text));

for (const status of ["Not Interested", "Do Not Contact", "Lost", "No Response", "Outreach Sent", "Interested", "Human Review", "Won", "Prospect Added"]) {
  t(`status "${status}" is never sent to`, send([P({ Status: status })]).filter((x) => x.has_send).length === 0);
}
r = send([P({ "Prospect ID": "A", Phone: "9876543210", Status: "Do Not Contact" }), P({ "Prospect ID": "B", Phone: "+91 98765 43210" })]);
t("a DNC number is blocked even when it appears in another campaign row", r.filter((x) => x.has_send).length === 0 && r.some((x) => x.row["Prospect ID"] === "B" && /Do Not Contact/.test(x.row["Send Error"])), JSON.stringify(r.map((x) => x.action)));
r = send([P({ "Prospect ID": "A" }), P({ "Prospect ID": "B", "Campaign Name": "Dental Clinics - Mangalagiri" })]);
t("same phone in two Ready rows: messaged once", r.filter((x) => x.has_send).length === 1 && r.filter((x) => x.action === "rejected").length === 1);
r = send([P({ "Prospect ID": "A", "First Sent Ms": WED_NOON - 200 * H, Status: "No Response" }), P({ "Prospect ID": "B" })]);
t("a number already contacted earlier is not messaged again", r.filter((x) => x.has_send).length === 0);

const bad = (o, re) => {
  const x = send([P(o)]);
  return x.length === 1 && !x[0].has_send && x[0].row.Status === "Human Review" && re.test(x[0].row["Send Error"]);
};
t("no contact basis -> held", bad({ "Contact Basis": "" }, /Contact Basis/));
t("no personalization note -> held", bad({ "Personalization Note": "" }, /Personalization/));
t("short note -> held", bad({ "Personalization Note": "nice site" }, /Personalization/));
t("no business name -> held", bad({ "Business Name": "" }, /Business Name/));
t("invalid phone -> held", bad({ Phone: "12345" }, /phone/i));
t("guarantee claim in the note -> held", bad({ "Personalization Note": "we can guarantee 100% more enquiries for you" }, /claim/));
t("held rows are not re-processed every run", send([P({ Status: "Human Review", "Send Error": "x" })]).length === 0);

// caps, hours
const many = (n, extra = {}) => Array.from({ length: n }, (_, i) => P({ "Prospect ID": `P${i}`, Phone: `98765${String(10000 + i)}`, ...extra }));
t("max 3 per run", send(many(25)).filter((x) => x.has_send).length === 3);
const today = (n) => Array.from({ length: n }, (_, i) => P({ "Prospect ID": `S${i}`, Phone: `98000${String(10000 + i)}`, Status: "Outreach Sent", "First Sent Ms": WED_NOON - 3 * H, "Last Sent Ms": WED_NOON - 3 * H }));
const followedToday = (n) => Array.from({ length: n }, (_, i) => P({ "Prospect ID": `F${i}`, Phone: `98000${String(10000 + i)}`, Status: "Follow-up 1 Sent", "First Sent Ms": WED_NOON - 60 * H, "Last Sent Ms": WED_NOON - 3 * H, "Follow-up Count": 1 }));
t("daily total cap of 20 respected", send([...followedToday(18), ...many(5)]).filter((x) => x.has_send).length === 2);
t("first-touch cap of 15 respected", send([...today(15), ...many(5)]).filter((x) => x.action === "initial").length === 0);
t("27 Sep 2026 is a Sunday", new Date(at(27, 12) + 330 * 60000).getUTCDay() === 0);
t("no sending on Sunday", send(many(3), at(27, 12)).filter((x) => x.has_send).length === 0);
t("no sending before 10:00 IST", send(many(3), at(30, 9, 59)).filter((x) => x.has_send).length === 0);
t("no sending at or after 18:00 IST", send(many(3), at(30, 18, 0)).filter((x) => x.has_send).length === 0);
t("sending allowed at 10:00 and 17:59 IST", send(many(3), at(30, 10, 0)).length === 3 && send(many(3), at(30, 17, 59)).length === 3);
t("Hot prospects go first", send([P({ "Prospect ID": "C", Phone: "9000000001", Priority: "Cold" }), P({ "Prospect ID": "H", Phone: "9000000002", Priority: "Hot" })])[0].row["Prospect ID"] === "H");

// ── sender: follow-ups ────────────────────────────────────────────────────────
const sent = (hoursAgo, o = {}) => P({ Status: "Outreach Sent", "First Sent Ms": WED_NOON - hoursAgo * H, "Last Sent Ms": WED_NOON - hoursAgo * H, "Follow-up Count": 0, "Reply Status": "Awaiting", ...o });
t("no follow-up before 48 h", send([sent(47)]).length === 0);
r = send([sent(49)]);
t("follow-up 1 after 2 days uses the fu1 template", r.length === 1 && r[0].send.body.template.name === "tw_outreach_fu1");
t("follow-up 1 sets Follow-up 1 Sent, count 1, next date = day 5", r[0].row.Status === "Follow-up 1 Sent" && r[0].row["Follow-up Count"] === 1 && r[0].row["Next Follow-up Date"] === "2026-10-03 11:00", r[0].row["Next Follow-up Date"]);
t("follow-up 1 params: name and business", JSON.stringify(r[0].send.body.template.components[0].parameters.map((p) => p.text)) === JSON.stringify(["Rahul", "Sharma Interiors"]));
t("follow-up 1 copy", r[0].row["Last Message Sent"] === "Hi Rahul, just checking once. Would you like a quick sample direction for Sharma Interiors's website/enquiry flow?\nYES - send it\nNO - not relevant");
t("no second follow-up 1", send([sent(60, { Status: "Follow-up 1 Sent", "Follow-up Count": 1 })]).length === 0);
r = send([sent(121, { Status: "Follow-up 1 Sent", "Follow-up Count": 1 })]);
t("follow-up 2 after 5 days", r.length === 1 && r[0].send.body.template.name === "tw_outreach_fu2" && r[0].row.Status === "Follow-up 2 Sent" && r[0].row["Follow-up Count"] === 2 && r[0].row["Last Message Sent"].startsWith("Last follow-up from my side, Rahul."));
t("missed follow-up 1 is skipped, not sent late", send([sent(121)])[0].send.body.template.name === "tw_outreach_fu2");
r = send([sent(169, { Status: "Follow-up 2 Sent", "Follow-up Count": 2 })]);
t("7 days -> No Response, nothing sent", r.length === 1 && !r[0].has_send && r[0].row.Status === "No Response" && r[0].row["Reply Status"] === "No Reply" && r[0].row["Next Follow-up Date"] === "");
t("No Response is final (never picked up again)", send([P({ Status: "No Response", "First Sent Ms": WED_NOON - 300 * H })]).length === 0);
t("no follow-up once they replied", send([sent(60, { "Last Inbound Ms": WED_NOON - 10 * H })]).length === 0);
t("no follow-up to Do Not Contact", send([sent(60, { "Do Not Contact": "Yes" })]).length === 0);
r = send([sent(60, { "First Sent Ms": at(27, 12) - 60 * H })], at(27, 12));
t("due follow-up on Sunday is marked Due, not sent", r.length === 1 && !r[0].has_send && r[0].row.Status === "Follow-up 1 Due");
t("Due marker is not rewritten every run", send([sent(60, { Status: "Follow-up 1 Due", "First Sent Ms": at(27, 12) - 60 * H })], at(27, 12)).length === 0);
r = send([sent(60, { Status: "Follow-up 1 Due" })]);
t("Due follow-up is sent when the window opens", r.length === 1 && r[0].has_send && r[0].row.Status === "Follow-up 1 Sent");
r = send([sent(60, { "Prospect ID": "F", Phone: "9000000009" }), ...many(3)]);
t("follow-ups go before new outreach", r[0].row["Prospect ID"] === "F" && r.filter((x) => x.has_send).length === 3);

// ── reply handler ─────────────────────────────────────────────────────────────
const S = (o = {}) => P({ Status: "Outreach Sent", "First Sent Ms": WED_NOON - 30 * H, "Last Sent Ms": WED_NOON - 30 * H, "Follow-up Count": 0, "Reply Status": "Awaiting", ...o });
const msg = (text, id = "wamid.1", extra = {}) => ({ channel: "WhatsApp", phone: "919876543210", text, message_id: id, received_ms: WED_NOON, ...extra });
const reply = (text, rows, id, extra) => exec("outbound-reply.js", rows, { "Prospect reply (from TW-08)": [msg(text, id, extra)] }, WED_NOON)[0];

let d = reply("YES", [S()]);
t("YES -> Interested, Hot, direction question, alert to projects and hello", d.row["Reply Status"] === "YES" && d.row.Status === "Interested" && d.row.Priority === "Hot" && d.send.body.text.body.startsWith("Great. To suggest the right direction") && d.send.body.text.body.includes("5. Automation/follow-up") && d.alert.to === "projects@turtleworks.in,hello@turtleworks.in" && d.row["Awaiting Reply"] === "direction", JSON.stringify(d.row));
t("alert has every field from the brief", ["Prospect ID:", "Name:", "Business:", "Phone:", "Niche:", "Campaign:", "Reply:", "Status:", "Suggested next action:"].every((k) => d.alert.body.includes(k)));
t("alert subject names the business and campaign", d.alert.subject === "[Outreach] Interested: Sharma Interiors (Interior Designers - Hyderabad)");
t("reply updates last-message, last-contacted and inbound time", d.row["Last Message Sent"] === d.send.body.text.body && d.row["Last Sent Ms"] === WED_NOON && d.row["Last Contacted"] === "2026-09-30 12:00" && d.row["Last Inbound Ms"] === WED_NOON && d.row["Next Follow-up Date"] === "");
for (const yesText of ["yes", "Yes please", "interested", "ok", "okay", "send it", "share", "sure"]) {
  t(`"${yesText}" is treated as YES`, reply(yesText, [S()], "y" + yesText).outcome === "yes");
}
d = reply("no", [S(), S({ "Prospect ID": "P2", Status: "Outreach Ready", "First Sent Ms": "" })]);
t("NO -> Not Interested, Do Not Contact, exact goodbye text", d.row["Reply Status"] === "NO" && d.row.Status === "Not Interested" && d.row["Do Not Contact"] === "Yes" && d.send.body.text.body === "No problem. Thanks for replying. We won't follow up further." && d.alert === null);
t("NO also suppresses the same number in other campaigns", d.updates.length === 2 && d.updates[1]["Prospect ID"] === "P2" && d.updates[1]["Do Not Contact"] === "Yes" && d.updates[1].Status === "Do Not Contact");
for (const stopText of ["STOP", "stop", "Not interested", "not relevant", "Please don't message again", "unsubscribe", "No thanks", "Nope"]) {
  const x = reply(stopText, [S()], "n" + stopText);
  t(`"${stopText}" is treated as NO and stops everything`, x.outcome === "no" && x.row["Do Not Contact"] === "Yes", x.outcome);
}
t("NO beats YES words in the same message", reply("no, please don't send anything", [S()]).outcome === "no");
d = reply("What is the price?", [S()]);
t("price -> Human Review, Hot, exact copy, team alerted, no number quoted", d.row.Status === "Human Review" && d.row.Priority === "Hot" && d.send.body.text.body.startsWith("Pricing depends on scope, pages, content, and automation needs.") && !/[₹$]|\brs\.?\s?\d|\binr\b/i.test(d.send.body.text.body) && d.alert.to === "projects@turtleworks.in");
t("yes + price question is a price question, not a plain YES", reply("yes, how much does it cost?", [S()]).outcome === "price");
d = reply("can we talk on a call?", [S()]);
t("call -> Call Requested, Hot, asks for a time", d.row.Status === "Call Requested" && d.row.Priority === "Hot" && d.send.body.text.body === "Sure. Please share a preferred time for a quick 10-minute call." && d.row["Awaiting Reply"] === "call time" && d.alert !== null);
d = reply("tomorrow at 4pm works, call me", [d.row], "wamid.2");
t("preferred call time recorded, bot stays quiet, team told", d.outcome === "call_time" && d.send === null && /Preferred call time: tomorrow at 4pm/.test(d.row.Notes) && d.row["Awaiting Reply"] === "" && d.alert.subject.includes("Call time received"));
d = reply("also can you call me again?", [d.row], "wamid.3");
t("once a person owns it, the bot never replies again", d.outcome === "on_hold" && d.send === null && d.alert !== null);
d = reply("2", [reply("yes", [S()]).row], "wamid.4");
t("direction answer 2 -> focus noted, no bot reply, team alerted", d.outcome === "direction" && d.send === null && /Focus: Better website look/.test(d.row.Notes) && d.row["Awaiting Reply"] === "" && d.alert !== null);
d = reply("ok", [d.row], "wamid.5");
t("after the direction question a later 'ok' does not restart the flow", d.outcome === "on_hold" && d.send === null);
const fu2 = S({ Status: "Follow-up 2 Sent", "Follow-up Count": 2 });
d = reply("yes", [fu2]);
t("YES to 'Should I close this?' means close, not interested", d.outcome === "close_yes" && d.row.Status === "Not Interested" && d.row["Do Not Contact"] === "Yes" && d.alert === null);
t("'yes send it' after follow-up 2 is real interest", reply("yes send it", [fu2]).outcome === "yes");
t("NO after follow-up 2 still stops", reply("no", [fu2]).outcome === "no");
d = reply("Who is this?", [S()]);
t("unknown reply -> Human Review, no bot reply, team alerted", d.outcome === "other" && d.row.Status === "Human Review" && d.send === null && d.alert !== null);
d = reply("", [S()], "img1", { media_type: "image" });
t("voice note or image -> human review", d.outcome === "other" && d.send === null);
t("duplicate message skipped", reply("yes", [S({ "Last Message ID": "dup" })], "dup").skip === true);
t("reply from a number we never messaged is skipped", reply("yes", [P()]).skip === true);
t("a Do Not Contact prospect is not handled here", reply("yes", [S({ "Do Not Contact": "Yes" })]).skip === true);
d = reply("yes", [S({ Status: "No Response" })]);
t("late YES after No Response revives the lead", d.outcome === "yes" && d.row.Status === "Interested");
t("send failure keeps the status change and adds Send Error", reply("no", [S()]).updates_failed[0]["Send Error"] === "Send Failed" && reply("no", [S()]).updates_failed[0]["Do Not Contact"] === "Yes");
t("notes keep a trail of what the prospect said", /Prospect: YES/.test(reply("YES", [S()]).row.Notes));

// ── routing tag (used inside the lead hub) ────────────────────────────────────
const tag = (prospects, inbound) => exec("tag-prospect-replies.js", prospects, { "Normalise inbound": inbound }, WED_NOON).map((x) => x.outbound_reply);
t("prospect reply is flagged", tag([S()], [{ channel: "WhatsApp", phone: "919876543210" }])[0] === true);
t("unknown number is a normal inbound lead", tag([S()], [{ channel: "WhatsApp", phone: "919999999999" }])[0] === false);
t("prospect never messaged yet is a normal inbound lead", tag([P()], [{ channel: "WhatsApp", phone: "919876543210" }])[0] === false);
t("Do Not Contact prospect is not routed to outbound", tag([S({ "Do Not Contact": "Yes" })], [{ channel: "WhatsApp", phone: "919876543210" }])[0] === false);
t("other channels are never flagged", tag([S()], [{ channel: "Instagram", phone: "" }])[0] === false);
t("missing Prospects tab changes nothing", tag([{}], [{ channel: "WhatsApp", phone: "919876543210" }])[0] === false);
t("mixed batch is flagged per message", JSON.stringify(tag([S()], [{ channel: "WhatsApp", phone: "919876543210" }, { channel: "WhatsApp", phone: "919111111111" }])) === "[true,false]");
t("prospect columns are unique", new Set(COLUMNS).size === COLUMNS.length && COLUMNS.includes("Contact Basis") && COLUMNS.includes("Do Not Contact"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
