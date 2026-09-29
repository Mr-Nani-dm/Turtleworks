// Generates TW-10 (outbound sender + follow-ups) and TW-11 (prospect reply handler).
// Run:  node build-outreach.mjs      (writes to ../ = integrations/n8n)
// Logic lives in outbound-send.js / outbound-reply.js and is unit-tested by test-outreach.cjs.
// The routing node that sends prospect replies here is built into TW-08 (../lead-hub/build-hub.mjs).
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ?? path.resolve(HERE, "..");
const src = (f) => readFileSync(path.join(HERE, f), "utf8").trim();
const COLUMNS = JSON.parse(readFileSync(path.join(HERE, "prospect-columns.json"), "utf8"));
const LOG_COLUMNS = ["Timestamp", "Prospect ID", "Business Name", "Step", "Result", "Detail"];

// Same plumbing as ../lead-hub/build-hub.mjs.
const stableId = (seed) => {
  const h = createHash("sha1").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const GMAIL = { gmailOAuth2: { id: "__GMAIL_CREDENTIAL_ID__", name: "Gmail account 2" } };
const SHEETS = { googleSheetsOAuth2Api: { id: "__GSHEETS_CREDENTIAL_ID__", name: "TW · Google Sheets" } };
const WA_TOKEN = { httpHeaderAuth: { id: "__WA_TOKEN_CREDENTIAL_ID__", name: "TW · WhatsApp Cloud API token" } };
const SHEET_DOC = { __rl: true, mode: "id", value: "__CRM_SHEET_ID__" };
const tab = (name) => ({ __rl: true, mode: "name", value: name });
const ERRORS_TO = "hello@turtleworks.in";
const TZ = "Asia/Kolkata";
const settings = { executionOrder: "v1", timezone: TZ, errorWorkflow: "__ERROR_WORKFLOW_ID__" };

const node = (name, type, typeVersion, position, parameters, extra = {}) => ({
  id: stableId(`${type}:${name}`),
  name,
  type: type.includes(".") ? type : `n8n-nodes-base.${type}`,
  typeVersion,
  position,
  parameters,
  ...extra,
});
const code = (name, position, file) => node(name, "code", 2, position, { mode: "runOnceForAllItems", jsCode: src(file) });
const inline = (name, position, jsCode) => node(name, "code", 2, position, { mode: "runOnceForEachItem", jsCode: jsCode.trim() });
const ifNode = (name, position, left) =>
  node(name, "if", 2.2, position, {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 },
      conditions: [{ id: stableId(name), leftValue: left, rightValue: "", operator: { type: "boolean", operation: "true", singleValue: true } }],
      combinator: "and",
    },
    options: {},
  });
const mapping = (columns, value, matching = []) => ({
  mappingMode: "defineBelow",
  value,
  matchingColumns: matching,
  schema: columns.map((id) => ({ id, displayName: id, required: false, defaultMatch: matching.includes(id), display: true, type: "string", canBeUsedToMatch: true, removed: false })),
  attemptToConvertTypes: false,
  convertFieldsToString: false,
});
const readProspects = (name, position) =>
  node(name, "googleSheets", 4.5, position, { resource: "sheet", operation: "read", documentId: SHEET_DOC, sheetName: tab("Prospects"), filtersUI: {}, combineFilters: "AND", options: {} }, { credentials: SHEETS, executeOnce: true, alwaysOutputData: true });
const saveProspect = (name, position) =>
  node(
    name,
    "googleSheets",
    4.5,
    position,
    {
      resource: "sheet",
      operation: "appendOrUpdate",
      documentId: SHEET_DOC,
      sheetName: tab("Prospects"),
      columns: mapping(COLUMNS, Object.fromEntries(COLUMNS.map((c) => [c, `={{ $json.final_row[${JSON.stringify(c)}] }}`])), ["Prospect ID"]),
      options: {},
    },
    { credentials: SHEETS, onError: "continueErrorOutput" },
  );
const logStep = (name, position, values) =>
  node(name, "googleSheets", 4.5, position, { resource: "sheet", operation: "append", documentId: SHEET_DOC, sheetName: tab("Outreach Log"), columns: mapping(LOG_COLUMNS, values), options: {} }, { credentials: SHEETS, onError: "continueRegularOutput" });
const graphPost = (name, position) =>
  node(
    name,
    "httpRequest",
    4.2,
    position,
    { method: "POST", url: "={{ $json.send.url }}", authentication: "genericCredentialType", genericAuthType: "httpHeaderAuth", sendBody: true, specifyBody: "json", jsonBody: "={{ JSON.stringify($json.send.body) }}", options: {} },
    { credentials: WA_TOKEN, onError: "continueErrorOutput" },
  );
const mail = (name, position, to, subject, message) =>
  node(name, "gmail", 2.1, position, { sendTo: to, subject, emailType: "text", message, options: { appendAttribution: false, senderName: "TurtleWorks Automation" } }, { credentials: GMAIL });
const link = (conns, from, outputs) => {
  conns[from] = { main: outputs.map((targets) => targets.map((to) => ({ node: to, type: "main", index: 0 }))) };
};
const nowIst = "={{ $now.setZone('Asia/Kolkata').toFormat('yyyy-LL-dd HH:mm') }}";
const sheetErr = (who) => `={{ '${who} could not write to the Google Sheet.\\n\\nError: ' + ($json.error ? ($json.error.message || JSON.stringify($json.error)) : 'unknown') + '\\n\\nCheck the Prospects tab (column names must match exactly) and the Outreach Log tab, then look at this execution in n8n.' }}`;
const sendFailBody = (who) =>
  `={{ '${who}\\n\\nProspect: ' + $json.row['Prospect ID'] + ' (' + $json.row['Business Name'] + ')\\nPhone: ' + $json.row.Phone + '\\nError: ' + $json.send_error + '\\n\\nThe prospect is now Human Review with Send Error set, so it will not be retried automatically. Common causes: template not approved yet, number not on WhatsApp, expired token, or WhatsApp declined a marketing message to this number.' }}`;

// ── TW-10 · outbound sender ───────────────────────────────────────────────────
const tw10 = {
  name: "TW-10 · Outreach · Outbound WhatsApp campaign — controlled batches and follow-ups",
  nodes: [
    node("Hourly 10:00-17:00 IST, Mon-Sat", "scheduleTrigger", 1.2, [0, 0], { rule: { interval: [{ field: "cronExpression", expression: "0 10-17 * * 1-6" }] } }),
    readProspects("Read prospects", [260, 0]),
    code("Outreach engine", [520, 0], "outbound-send.js"),
    ifNode("Message to send?", [780, 0], "={{ $json.has_send }}"),
    node("Send one at a time", "splitInBatches", 3, [1040, -100], { batchSize: 1, options: {} }),
    graphPost("Send WhatsApp message", [1300, -100]),
    inline("Row after send OK", [1560, -200], `const d = $('Send one at a time').item.json;\nreturn { json: { ...d, final_row: d.row, send_result: "sent", send_error: "" } };`),
    inline(
      "Row after send failed",
      [1560, 20],
      `const d = $('Send one at a time').item.json;
const err = $json.error || {};
const why = String(err.description || err.message || JSON.stringify(err) || "unknown").slice(0, 150);
return { json: { ...d, final_row: { ...d.row_failed, "Send Error": "Send Failed: " + why }, send_result: "failed", send_error: why } };`,
    ),
    saveProspect("Save prospect row", [1820, -100]),
    node("Wait between messages", "wait", 1.1, [2080, -100], { resume: "timeInterval", amount: "={{ 70 + Math.floor(Math.random() * 71) }}", unit: "seconds" }, { webhookId: stableId("tw10-wait") }),
    logStep("Log outreach step", [1820, -260], {
      Timestamp: "={{ $json.log.Timestamp }}",
      "Prospect ID": "={{ $json.log['Prospect ID'] }}",
      "Business Name": "={{ $json.log['Business Name'] }}",
      Step: "={{ $json.log.Step }}",
      Result: "={{ $json.action + ' / ' + $json.send_result }}",
      Detail: "={{ $json.send_error || $json.row.Status }}",
    }),
    mail("Alert: send failed", [1820, 140], ERRORS_TO, "={{ 'TW-10 alert: WhatsApp send failed - ' + $json.row['Business Name'] }}", sendFailBody("An outreach WhatsApp message could not be sent.")),
    mail("Alert: CRM update failed", [2080, 60], ERRORS_TO, "TW-10 alert: could not update the prospect sheet", sheetErr("The outreach sender")),

    inline("Row (no message)", [1040, 260], `return { json: { ...$json, final_row: $json.row, send_result: "none", send_error: "" } };`),
    saveProspect("Save prospect row (no message)", [1300, 260]),
    logStep("Log (no message)", [1300, 420], {
      Timestamp: "={{ $json.log.Timestamp }}",
      "Prospect ID": "={{ $json.log['Prospect ID'] }}",
      "Business Name": "={{ $json.log['Business Name'] }}",
      Step: "={{ $json.log.Step }}",
      Result: "={{ $json.log.Result }}",
      Detail: "={{ $json.log.Detail }}",
    }),
    mail("Alert: CRM update failed (no message)", [1560, 300], ERRORS_TO, "TW-10 alert: could not update the prospect sheet", sheetErr("The outreach sender")),
  ],
  connections: {},
  settings,
};
{
  const c = tw10.connections;
  link(c, "Hourly 10:00-17:00 IST, Mon-Sat", [["Read prospects"]]);
  link(c, "Read prospects", [["Outreach engine"]]);
  link(c, "Outreach engine", [["Message to send?"]]);
  link(c, "Message to send?", [["Send one at a time"], ["Row (no message)"]]);
  link(c, "Send one at a time", [[], ["Send WhatsApp message"]]);
  link(c, "Send WhatsApp message", [["Row after send OK"], ["Row after send failed"]]);
  link(c, "Row after send OK", [["Save prospect row", "Log outreach step"]]);
  link(c, "Row after send failed", [["Save prospect row", "Log outreach step", "Alert: send failed"]]);
  link(c, "Save prospect row", [["Wait between messages"], ["Alert: CRM update failed"]]);
  link(c, "Alert: CRM update failed", [["Wait between messages"]]);
  link(c, "Wait between messages", [["Send one at a time"]]);
  link(c, "Row (no message)", [["Save prospect row (no message)", "Log (no message)"]]);
  link(c, "Save prospect row (no message)", [[], ["Alert: CRM update failed (no message)"]]);
}

// ── TW-11 · prospect reply handler ────────────────────────────────────────────
const tw11 = {
  name: "TW-11 · Outreach · Prospect reply handler — YES, NO, price, call",
  nodes: [
    node("Prospect reply (from TW-08)", "executeWorkflowTrigger", 1.1, [0, 0], { inputSource: "passthrough" }),
    readProspects("Read prospects", [260, 0]),
    code("Reply engine", [520, 0], "outbound-reply.js"),
    ifNode("Skipped?", [780, 0], "={{ $json.skip }}"),
    ifNode("Reply needed?", [1040, 120], "={{ $json.has_send }}"),
    graphPost("Send WhatsApp reply", [1300, 0]),
    inline("Row after send OK", [1560, -100], `const d = $('Reply needed?').item.json;\nreturn { json: { ...d, final_updates: d.updates, send_result: "sent", send_error: "" } };`),
    inline(
      "Row after send failed",
      [1560, 100],
      `const d = $('Reply needed?').item.json;
const err = $json.error || {};
const why = String(err.description || err.message || JSON.stringify(err) || "unknown").slice(0, 150);
const updates = d.updates_failed.map((u, i) => (i === 0 ? { ...u, "Send Error": "Send Failed: " + why } : u));
return { json: { ...d, final_updates: updates, send_result: "failed", send_error: why } };`,
    ),
    inline("Row (no reply)", [1300, 300], `return { json: { ...$json, final_updates: $json.updates, send_result: "none", send_error: "" } };`),
    node("One item per row update", "code", 2, [1820, 60], {
      mode: "runOnceForAllItems",
      jsCode: `return $input.all().flatMap(({ json: d }) => d.final_updates.map((u) => ({ json: { final_row: u, prospect_id: u["Prospect ID"] } })));`,
    }),
    saveProspect("Save prospect row", [2080, 60]),
    ifNode("Alert the team?", [1820, 300], "={{ $json.has_alert }}"),
    mail("Email alert to team", [2080, 300], "={{ $json.alert.to }}", "={{ $json.alert.subject }}", "={{ $json.alert.body }}"),
    logStep("Log reply", [1820, -220], {
      Timestamp: "={{ $json.log.Timestamp }}",
      "Prospect ID": "={{ $json.log['Prospect ID'] }}",
      "Business Name": "={{ $json.log['Business Name'] }}",
      Step: "reply",
      Result: "={{ $json.outcome + ' / ' + $json.send_result }}",
      Detail: "={{ $json.send_error || $json.log.Detail }}",
    }),
    mail(
      "Alert: reply failed",
      [1820, 460],
      ERRORS_TO,
      "={{ 'TW-11 alert: automatic reply failed - ' + $json.row['Business Name'] }}",
      sendFailBody("A prospect replied, but our automatic answer could not be sent. Their status was still updated."),
    ),
    mail("Alert: CRM update failed", [2340, 120], ERRORS_TO, "TW-11 alert: could not update the prospect sheet", sheetErr("The reply handler")),
  ],
  connections: {},
  settings,
};
{
  const c = tw11.connections;
  link(c, "Prospect reply (from TW-08)", [["Read prospects"]]);
  link(c, "Read prospects", [["Reply engine"]]);
  link(c, "Reply engine", [["Skipped?"]]);
  link(c, "Skipped?", [[], ["Reply needed?"]]);
  link(c, "Reply needed?", [["Send WhatsApp reply"], ["Row (no reply)"]]);
  link(c, "Send WhatsApp reply", [["Row after send OK"], ["Row after send failed"]]);
  link(c, "Row after send OK", [["One item per row update", "Alert the team?", "Log reply"]]);
  link(c, "Row after send failed", [["One item per row update", "Alert the team?", "Log reply", "Alert: reply failed"]]);
  link(c, "Row (no reply)", [["One item per row update", "Alert the team?", "Log reply"]]);
  link(c, "One item per row update", [["Save prospect row"]]);
  link(c, "Save prospect row", [[], ["Alert: CRM update failed"]]);
  link(c, "Alert the team?", [["Email alert to team"], []]);
}

const files = {
  "tw-10-outreach-outbound-whatsapp-campaign.json": tw10,
  "tw-11-outreach-prospect-reply-handler.json": tw11,
};
for (const [file, wf] of Object.entries(files)) {
  writeFileSync(path.join(OUT, file), `${JSON.stringify({ ...wf, pinData: {} }, null, 2)}\n`);
}
writeFileSync(path.join(OUT, "prospects-sheet-columns.csv"), `${COLUMNS.join(",")}\n`);
writeFileSync(path.join(OUT, "outreach-log-sheet-columns.csv"), `${LOG_COLUMNS.join(",")}\n`);
console.log("wrote", Object.keys(files).join(", "), `(${tw10.nodes.length} + ${tw11.nodes.length} nodes)`);
