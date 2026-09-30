import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const N8N = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../n8n");
const load = (file) => JSON.parse(readFileSync(path.join(N8N, file), "utf8"));
const FILES = {
  tw01: "tw-01-leads-website-enquiry-intake.json",
  tw05: "tw-05-leads-ai-triage-draft-reply.json",
  tw07: "tw-07-deals-proposal-invoice-follow-ups.json",
  tw08: "tw-08-leads-inbound-lead-hub.json",
  tw09: "tw-09-leads-follow-up-and-close-out.json",
};
const node = (wf, name) => {
  const n = wf.nodes.find((x) => x.name === name);
  assert.ok(n, `node "${name}" not found`);
  return n;
};
const into = (wf, name) => Object.entries(wf.connections).filter(([, c]) => c.main.some((o) => o.some((t) => t.node === name))).map(([from]) => from);
const outOf = (wf, name) => wf.connections[name].main.flat().map((t) => t.node);

// Runs a Code node in "run once for each item" mode the way n8n does.
function runEach(codeNode, json, named = {}) {
  assert.equal(codeNode.parameters.mode, "runOnceForEachItem");
  const $ = (name) => ({ item: { json: named[name] } });
  const result = new Function("$json", "$", codeNode.parameters.jsCode)(json, $);
  return result.json;
}

const HOSTILE = `"><img src=x onerror=alert(1)><script>alert(2)</script>`;

test("TW-01: the acknowledgement is branded, in order, and sent as HTML", () => {
  const wf = load(FILES.tw01);
  const brand = node(wf, "Brand the acknowledgement email");
  const gmail = node(wf, "Acknowledge enquirer — auto-reply");
  assert.deepEqual(into(wf, brand.name), ["Hand off to lead hub (TW-08)"]);
  assert.deepEqual(outOf(wf, brand.name), [gmail.name]);
  assert.equal(gmail.parameters.emailType, "html");
  assert.equal(gmail.parameters.message, "={{ $json.email_html }}");

  const out = runEach(brand, {}, { "Prepare lead record": { lead_id: "TW-20260930-AB12", first_name: "Asha" } });
  assert.match(out.email_html, /TurtleWorks/);
  assert.match(out.email_html, /Hi Asha,/);
  assert.match(out.email_html, /TW-20260930-AB12/);
  assert.match(out.email_html, /reply personally/);
  assert.match(out.email_html, /turtleworks-mark\.png/);
});

test("TW-01: hostile names cannot inject markup into the email", () => {
  const brand = node(load(FILES.tw01), "Brand the acknowledgement email");
  const out = runEach(brand, {}, { "Prepare lead record": { lead_id: HOSTILE, first_name: HOSTILE } });
  assert.doesNotMatch(out.email_html, /<img src=x/);
  assert.doesNotMatch(out.email_html, /<script>alert/);
  assert.match(out.email_html, /&lt;img src=x/);
});

test("TW-05: the AI draft reply is wrapped, keeps its sign-off, and stays a draft", () => {
  const wf = load(FILES.tw05);
  const brand = node(wf, "Brand the draft reply");
  const draft = node(wf, "Save draft reply in Gmail");
  assert.deepEqual(outOf(wf, brand.name), [draft.name]);
  assert.deepEqual(into(wf, brand.name), ["Check and shape the AI result"]);
  assert.equal(draft.parameters.resource, "draft");
  assert.equal(draft.parameters.emailType, "html");
  assert.equal(draft.parameters.message, "={{ $json.draft_html }}");
  assert.equal(draft.parameters.options.sendTo, "={{ $json.email }}");

  const out = runEach(brand, { draft_reply: "Hi Asha,\n\nThanks for reaching out.\n\nBest regards,\nTurtleWorks", lead_id: "TW-1", email: "asha@shop.in" });
  assert.equal(out.email, "asha@shop.in", "earlier fields survive for the draft's recipient");
  assert.match(out.draft_html, /Hi Asha,/);
  assert.match(out.draft_html, /Best regards,<br>TurtleWorks/);
  assert.match(out.draft_html, /TW-1/);
});

test("TW-05: an AI reply containing markup is escaped", () => {
  const brand = node(load(FILES.tw05), "Brand the draft reply");
  const out = runEach(brand, { draft_reply: `Hi,\n\n${HOSTILE}`, lead_id: "TW-1" });
  assert.doesNotMatch(out.draft_html, /<img src=x/);
  assert.doesNotMatch(out.draft_html, /<script>alert/);
});

test("TW-07: client proposal and invoice drafts are branded and still only drafts", () => {
  const wf = load(FILES.tw07);
  const brand = node(wf, "Brand the client draft");
  const draft = node(wf, "Save client follow-up as Gmail draft");
  assert.deepEqual(into(wf, brand.name), ["Build client follow-up drafts"]);
  assert.deepEqual(outOf(wf, brand.name), [draft.name]);
  assert.equal(draft.parameters.resource, "draft");
  assert.equal(draft.parameters.message, "={{ $json.body_html }}");

  const out = runEach(brand, { subject: "Invoice INV-7 is due", body: "Hi Ravi,\n\nA gentle reminder about invoice INV-7.\n\nThanks,\nTurtleWorks", to: "ravi@x.in" });
  assert.equal(out.to, "ravi@x.in");
  assert.match(out.body_html, /invoice INV-7/);
  assert.match(out.body_html, /Invoice INV-7 is due/);
});

test("TW-08: email replies to email leads are branded, threaded, and carry no STOP line", () => {
  const wf = load(FILES.tw08);
  const brand = node(wf, "Brand the email");
  const reply = node(wf, "Reply by email");
  assert.deepEqual(into(wf, brand.name), ["How to send?"]);
  assert.deepEqual(outOf(wf, brand.name), [reply.name]);
  assert.equal(reply.parameters.emailType, "html");
  assert.equal(reply.parameters.message, "={{ $json.send.html }}");
  assert.equal(reply.parameters.messageId, "={{ $json.send.message_id }}");

  const send = { via: "email", to: "v@x.in", subject: "Re: Need a website", message_id: "g10", message: "Hi Vikram, welcome to TurtleWorks. Thanks for reaching out.\n\nWhat would you like help with?\n1. Website design\n2. Business automation" };
  const out = runEach(brand, { has_send: true, send });
  assert.equal(out.send.message_id, "g10", "threading survives");
  assert.match(out.send.html, /Hi Vikram, welcome to TurtleWorks/);
  assert.match(out.send.html, /1\. Website design<br>2\. Business automation/);
  assert.doesNotMatch(out.send.html, /Reply STOP/);
  assert.equal(out.has_send, true);
});

test("TW-09: the one automated follow-up email is branded and tells people how to stop it", () => {
  const wf = load(FILES.tw09);
  const brand = node(wf, "Brand the follow-up email");
  const reply = node(wf, "Send email follow-up");
  assert.deepEqual(into(wf, brand.name), ["How to send?"]);
  assert.deepEqual(outOf(wf, brand.name), [reply.name]);
  assert.equal(reply.parameters.emailType, "html");

  const send = { via: "email", to: "v@x.in", subject: "Following up", message_id: "g10", message: "Hi Vikram, just checking in. Happy to continue whenever suits you." };
  const out = runEach(brand, { has_send: true, send });
  assert.match(out.send.html, /Reply STOP/);
  assert.match(out.send.html, /just checking in/);
});

test("embedded template code is plain script: no import or export statements survive", () => {
  const nodes = [
    node(load(FILES.tw01), "Brand the acknowledgement email"),
    node(load(FILES.tw05), "Brand the draft reply"),
    node(load(FILES.tw07), "Brand the client draft"),
    node(load(FILES.tw08), "Brand the email"),
    node(load(FILES.tw09), "Brand the follow-up email"),
  ];
  for (const n of nodes) {
    assert.doesNotMatch(n.parameters.jsCode, /^\s*(import|export)\s/m, n.name);
    assert.match(n.parameters.jsCode, /function renderEmail\(/, n.name);
  }
});

test("internal team alerts stay plain text: quick to scan and to reply to", () => {
  const team = [
    [FILES.tw01, "Notify team — new enquiry"],
    [FILES.tw08, "Email alert to team"],
    [FILES.tw08, "Alert: CRM update failed"],
    [FILES.tw09, "Email alert to team"],
  ];
  for (const [file, name] of team) {
    const n = node(load(file), name);
    assert.ok(!n.parameters.emailType || n.parameters.emailType === "text", `${name} should be plain text`);
  }
});

test("every workflow still has a consistent graph after the changes", () => {
  for (const file of Object.values(FILES)) {
    const wf = load(file);
    const names = new Set(wf.nodes.map((n) => n.name));
    for (const [from, c] of Object.entries(wf.connections)) {
      assert.ok(names.has(from), `${file}: unknown source ${from}`);
      for (const t of c.main.flat()) assert.ok(names.has(t.node), `${file}: unknown target ${t.node}`);
    }
    const ids = wf.nodes.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate node ids`);
  }
});
