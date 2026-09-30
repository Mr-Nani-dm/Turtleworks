// Generates TW-08 (inbound lead hub) and TW-09 (follow-up & close-out) plus the CRM sheet headers.
// Run:  node build-hub.mjs          (writes to ../ = integrations/n8n)
// Logic lives in normalise.js / engine.js / followup.js and is unit-tested by test-hub.cjs.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ?? path.resolve(HERE, "..");
const src = (f) => readFileSync(path.join(HERE, f), "utf8").trim();
const COLUMNS = JSON.parse(readFileSync(path.join(HERE, "columns.json"), "utf8"));
const LOG_COLUMNS = ["Timestamp", "Lead ID", "Channel", "Step", "Result", "Detail"];

const stableId = (seed) => {
  const h = createHash("sha1").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const GMAIL = { gmailOAuth2: { id: "__GMAIL_CREDENTIAL_ID__", name: "Gmail account 2" } };
const SHEETS = { googleSheetsOAuth2Api: { id: "__GSHEETS_CREDENTIAL_ID__", name: "TW · Google Sheets" } };
const WA_TOKEN = { httpHeaderAuth: { id: "__WA_TOKEN_CREDENTIAL_ID__", name: "TW · WhatsApp Cloud API token" } };
const PAGE_TOKEN = { httpHeaderAuth: { id: "__META_PAGE_TOKEN_CREDENTIAL_ID__", name: "TW · Meta Page token (Instagram/Facebook)" } };
const SHEET_DOC = { __rl: true, mode: "id", value: "__CRM_SHEET_ID__" };
const tab = (name) => ({ __rl: true, mode: "name", value: name });
const ERRORS_TO = "hello@turtleworks.in";
const TZ = "Asia/Kolkata";

const node = (name, type, typeVersion, position, parameters, extra = {}) => ({
  id: stableId(`${type}:${name}`),
  name,
  type: type.includes(".") ? type : `n8n-nodes-base.${type}`,
  typeVersion,
  position,
  parameters,
  ...extra,
});
const code = (name, position, file, mode = "runOnceForAllItems", extra = {}) =>
  node(name, "code", 2, position, { mode, jsCode: src(file) }, extra);
const inline = (name, position, jsCode, extra = {}) =>
  node(name, "code", 2, position, { mode: "runOnceForEachItem", jsCode: jsCode.trim() }, extra);

// The branded layout (../../email/template.mjs) is embedded into a Code node because n8n cannot import files.
const EMAIL_TEMPLATE = readFileSync(path.join(HERE, "../../email/template.mjs"), "utf8").replace(/^export /gm, "").trim();
const brandEmail = (name, position, { optOut }) =>
  node(name, "code", 2, position, {
    mode: "runOnceForEachItem",
    jsCode: `${EMAIL_TEMPLATE}

const s = $json.send;
return { json: { ...$json, send: { ...s, html: renderEmail({
  preheader: String(s.message).split("\\n")[0].slice(0, 120),
  title: s.subject,
  paragraphs: paragraphsFrom(s.message),
  footerNote: "You are receiving this email because you wrote to hello@turtleworks.in.",
  optOut: ${optOut},
}) } } };`,
  });

const cond = (seed, left, operation) => ({
  options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 },
  conditions: [{ id: stableId(seed), leftValue: left, rightValue: "", operator: { type: "boolean", operation, singleValue: true } }],
  combinator: "and",
});
const ifNode = (name, position, left, operation = "true") => node(name, "if", 2.2, position, { conditions: cond(name, left, operation), options: {} });

const switchVia = (name, position) =>
  node(name, "switch", 3.2, position, {
    rules: {
      values: [
        ["whatsapp", "WhatsApp"],
        ["dm", "Instagram / Facebook"],
        ["email", "Email"],
      ].map(([value, outputKey]) => ({
        conditions: {
          options: { caseSensitive: true, leftValue: "", typeValidation: "strict", version: 2 },
          conditions: [{ id: stableId(`${name}:${value}`), leftValue: "={{ $json.send.via }}", rightValue: value, operator: { type: "string", operation: "equals" } }],
          combinator: "and",
        },
        renameOutput: true,
        outputKey,
      })),
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
const rowExpr = (field) => `={{ $json.final_row[${JSON.stringify(field)}] }}`;
const saveRow = (name, position) =>
  node(
    name,
    "googleSheets",
    4.5,
    position,
    {
      resource: "sheet",
      operation: "appendOrUpdate",
      documentId: SHEET_DOC,
      sheetName: tab("Leads"),
      columns: mapping(COLUMNS, Object.fromEntries(COLUMNS.map((c) => [c, rowExpr(c)])), ["Lead ID"]),
      options: {},
    },
    { credentials: SHEETS, onError: "continueErrorOutput" },
  );
const logRow = (name, position, values) =>
  node(
    name,
    "googleSheets",
    4.5,
    position,
    { resource: "sheet", operation: "append", documentId: SHEET_DOC, sheetName: tab("Log"), columns: mapping(LOG_COLUMNS, values), options: {} },
    { credentials: SHEETS, onError: "continueRegularOutput" },
  );
const readCrm = (name, position) =>
  node(
    name,
    "googleSheets",
    4.5,
    position,
    { resource: "sheet", operation: "read", documentId: SHEET_DOC, sheetName: tab("Leads"), filtersUI: {}, combineFilters: "AND", options: {} },
    { credentials: SHEETS, executeOnce: true, alwaysOutputData: true },
  );

const graphPost = (name, position, credentials) =>
  node(
    name,
    "httpRequest",
    4.2,
    position,
    {
      method: "POST",
      url: "={{ $json.send.url }}",
      authentication: "genericCredentialType",
      genericAuthType: "httpHeaderAuth",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ JSON.stringify($json.send.body) }}",
      options: {},
    },
    { credentials, onError: "continueErrorOutput" },
  );
const emailReply = (name, position) =>
  node(
    name,
    "gmail",
    2.1,
    position,
    {
      resource: "message",
      operation: "reply",
      messageId: "={{ $json.send.message_id }}",
      emailType: "html",
      message: "={{ $json.send.html }}",
      options: { appendAttribution: false, senderName: "TurtleWorks" },
    },
    { credentials: GMAIL, onError: "continueErrorOutput" },
  );
const mail = (name, position, to, subject, message, extra = {}) =>
  node(name, "gmail", 2.1, position, { sendTo: to, subject, emailType: "text", message, options: { appendAttribution: false, senderName: "TurtleWorks Automation" } }, { credentials: GMAIL, ...extra });
const teamAlert = (name, position) => mail(name, position, "={{ $json.alert.to }}", "={{ $json.alert.subject }}", "={{ $json.alert.body }}");

const link = (conns, from, outputs) => {
  conns[from] = { main: outputs.map((targets) => targets.map((to) => ({ node: to, type: "main", index: 0 }))) };
};
const settings = { executionOrder: "v1", timezone: TZ, errorWorkflow: "__ERROR_WORKFLOW_ID__" };

// ── TW-08 · inbound lead hub ──────────────────────────────────────────────────
const nowIst = "={{ $now.setZone('Asia/Kolkata').toFormat('yyyy-LL-dd HH:mm') }}";
const tw08 = {
  name: "TW-08 · Leads · Inbound lead hub — WhatsApp, Instagram, Facebook, email, website",
  nodes: [
    node("Meta webhook · verification (GET)", "webhook", 2, [0, 0], { httpMethod: "GET", path: "__META_WEBHOOK_PATH__", responseMode: "responseNode", options: {} }, { webhookId: stableId("tw08-meta-get") }),
    inline(
      "Check verify token",
      [260, 0],
      `const q = $json.query || {};
const ok = q["hub.mode"] === "subscribe" && q["hub.verify_token"] === "__META_VERIFY_TOKEN__";
return { json: { ok, challenge: ok ? String(q["hub.challenge"]) : "" } };`,
    ),
    node("Answer Meta verification", "respondToWebhook", 1.1, [520, 0], {
      respondWith: "text",
      responseBody: "={{ $json.ok ? $json.challenge : 'Forbidden' }}",
      options: { responseCode: "={{ $json.ok ? 200 : 403 }}" },
    }),

    node("Meta webhook · messages (POST)", "webhook", 2, [0, 240], { httpMethod: "POST", path: "__META_WEBHOOK_PATH__", options: {} }, { webhookId: stableId("tw08-meta-post") }),
    node(
      "Gmail · new enquiry email",
      "gmailTrigger",
      1.3,
      [0, 480],
      {
        pollTimes: { item: [{ mode: "everyX", value: 5, unit: "minutes" }] },
        simple: false,
        filters: { q: "in:inbox -category:promotions -category:social -category:updates -category:forums -from:me" },
        options: {},
      },
      { credentials: GMAIL, disabled: true, notes: "Shipped OFF: turn on only after testing, so the bot never auto-replies to cold sales email." },
    ),
    node("Website lead (from TW-01)", "executeWorkflowTrigger", 1.1, [0, 720], { inputSource: "passthrough" }),

    code("Normalise inbound", [300, 480], "normalise.js"),
    node(
      "Read prospects",
      "googleSheets",
      4.5,
      [560, 900],
      { resource: "sheet", operation: "read", documentId: SHEET_DOC, sheetName: tab("Prospects"), filtersUI: {}, combineFilters: "AND", options: {} },
      { credentials: SHEETS, executeOnce: true, alwaysOutputData: true, onError: "continueRegularOutput", notes: "Outbound campaign list. If the Prospects tab does not exist yet, this is skipped and every message is treated as a normal inbound lead." },
    ),
    code("Tag prospect replies", [820, 900], "../outreach/tag-prospect-replies.js"),
    ifNode("Reply from an outbound prospect?", [1080, 900], "={{ $json.outbound_reply }}"),
    node(
      "Hand off to outbound replies (TW-11)",
      "executeWorkflow",
      1.2,
      [1340, 900],
      {
        source: "database",
        workflowId: { __rl: true, mode: "id", value: "__OUTBOUND_REPLY_WORKFLOW_ID__" },
        workflowInputs: { mappingMode: "defineBelow", value: {}, matchingColumns: [], schema: [], attemptToConvertTypes: false, convertFieldsToString: true },
        mode: "once",
        options: { waitForSubWorkflow: false },
      },
      { onError: "continueRegularOutput" },
    ),
    readCrm("Read CRM leads", [560, 480]),
    code("Lead engine", [820, 480], "engine.js"),
    ifNode("Duplicate or ignored?", [1080, 480], "={{ $json.skip }}"),
    logRow("Log: decision", [1340, 300], {
      Timestamp: "={{ $json.log.Timestamp }}",
      "Lead ID": "={{ $json.log['Lead ID'] }}",
      Channel: "={{ $json.log.Channel }}",
      Step: "={{ $json.log.Step }}",
      Result: "={{ $json.log.Result }}",
      Detail: "={{ $json.log.Detail }}",
    }),
    ifNode("Reply needed?", [1340, 560], "={{ $json.has_send }}"),
    switchVia("How to send?", [1600, 440]),
    graphPost("Send WhatsApp message", [1880, 300], WA_TOKEN),
    graphPost("Send Instagram / Facebook message", [1880, 480], PAGE_TOKEN),
    brandEmail("Brand the email", [1740, 780], { optOut: false }),
    emailReply("Reply by email", [1880, 660]),

    inline("Row after send OK", [2160, 380], `const d = $('Lead engine').item.json;\nreturn { json: { ...d, final_row: d.row, send_result: "sent", send_error: "" } };`),
    inline(
      "Row after send failed",
      [2160, 620],
      `const d = $('Lead engine').item.json;
const err = $json.error || {};
return { json: { ...d, final_row: d.row_failed, send_result: "failed", send_error: String(err.description || err.message || JSON.stringify(err) || "unknown").slice(0, 300) } };`,
    ),
    inline("Row (no reply)", [1600, 700], `return { json: { ...$json, final_row: $json.row, send_result: "none", send_error: "" } };`),

    saveRow("Save lead to CRM", [2440, 500]),
    mail(
      "Alert: CRM update failed",
      [2720, 600],
      ERRORS_TO,
      "TW-08 alert: could not update the CRM sheet",
      "={{ 'The lead hub could not write to the Google Sheet.\\n\\nLead: ' + ($('Lead engine').item.json.row['Lead ID']) + ' (' + $('Lead engine').item.json.row.Name + ')\\nError: ' + ($json.error ? ($json.error.message || JSON.stringify($json.error)) : 'unknown') + '\\n\\nThe customer was not affected; their message and the automated reply (if any) went through. Add or fix the row by hand.' }}",
    ),
    ifNode("Alert the team?", [2440, 260], "={{ $json.has_alert }}"),
    teamAlert("Email alert to team", [2720, 260]),
    logRow("Log: reply sent", [2440, 100], {
      Timestamp: nowIst,
      "Lead ID": "={{ $json.row['Lead ID'] }}",
      Channel: "={{ $json.row.Channel }}",
      Step: "reply",
      Result: "sent",
      Detail: "={{ $json.send.via }}",
    }),
    logRow("Log: reply failed", [2440, 800], {
      Timestamp: nowIst,
      "Lead ID": "={{ $json.row['Lead ID'] }}",
      Channel: "={{ $json.row.Channel }}",
      Step: "reply",
      Result: "FAILED",
      Detail: "={{ $json.send_error }}",
    }),
    mail(
      "Alert: automated reply failed",
      [2720, 800],
      ERRORS_TO,
      "={{ 'TW-08 alert: automated reply failed - ' + $json.row.Name }}",
      "={{ 'An automated reply could not be sent, so the lead was NOT advanced.\\n\\nLead: ' + $json.row['Lead ID'] + '\\nName: ' + $json.row.Name + '\\nChannel: ' + $json.row.Channel + ' via ' + $json.send.via + '\\nError: ' + $json.send_error + '\\n\\nReply to the customer personally. Common causes: an expired WhatsApp/Meta token, a WhatsApp template not approved yet, or the customer chat window closed.' }}",
    ),
  ],
  connections: {},
  settings,
};
{
  const c = tw08.connections;
  link(c, "Meta webhook · verification (GET)", [["Check verify token"]]);
  link(c, "Check verify token", [["Answer Meta verification"]]);
  link(c, "Meta webhook · messages (POST)", [["Normalise inbound"]]);
  link(c, "Gmail · new enquiry email", [["Normalise inbound"]]);
  link(c, "Website lead (from TW-01)", [["Normalise inbound"]]);
  link(c, "Normalise inbound", [["Read prospects"]]);
  link(c, "Read prospects", [["Tag prospect replies"]]);
  link(c, "Tag prospect replies", [["Reply from an outbound prospect?"]]);
  link(c, "Reply from an outbound prospect?", [["Hand off to outbound replies (TW-11)"], ["Read CRM leads"]]);
  link(c, "Read CRM leads", [["Lead engine"]]);
  link(c, "Lead engine", [["Duplicate or ignored?"]]);
  link(c, "Duplicate or ignored?", [[], ["Log: decision", "Reply needed?"]]);
  link(c, "Reply needed?", [["How to send?"], ["Row (no reply)"]]);
  link(c, "How to send?", [["Send WhatsApp message"], ["Send Instagram / Facebook message"], ["Brand the email"]]);
  link(c, "Brand the email", [["Reply by email"]]);
  for (const send of ["Send WhatsApp message", "Send Instagram / Facebook message", "Reply by email"]) {
    link(c, send, [["Row after send OK"], ["Row after send failed"]]);
  }
  link(c, "Row after send OK", [["Save lead to CRM", "Alert the team?", "Log: reply sent"]]);
  link(c, "Row after send failed", [["Save lead to CRM", "Alert the team?", "Log: reply failed", "Alert: automated reply failed"]]);
  link(c, "Row (no reply)", [["Save lead to CRM", "Alert the team?"]]);
  link(c, "Save lead to CRM", [[], ["Alert: CRM update failed"]]);
  link(c, "Alert the team?", [["Email alert to team"], []]);
}

// ── TW-09 · follow-up & close-out ─────────────────────────────────────────────
const tw09 = {
  name: "TW-09 · Leads · Follow-up after 24 h, close out after 3 days",
  nodes: [
    node("Hourly, 09:00-21:00 IST", "scheduleTrigger", 1.2, [0, 0], { rule: { interval: [{ field: "cronExpression", expression: "5 9-20 * * *" }] } }),
    readCrm("Read CRM leads", [260, 0]),
    code("Follow-up engine", [520, 0], "followup.js"),
    ifNode("Message to send?", [780, 0], "={{ $json.has_send }}"),
    switchVia("How to send?", [1040, -120]),
    graphPost("Send WhatsApp follow-up", [1300, -260], WA_TOKEN),
    graphPost("Send Instagram / Facebook follow-up", [1300, -100], PAGE_TOKEN),
    brandEmail("Brand the follow-up email", [1160, 140], { optOut: true }),
    emailReply("Send email follow-up", [1300, 60]),
    inline("Row after send OK", [1560, -180], `const d = $('Follow-up engine').item.json;\nreturn { json: { ...d, final_row: d.row, send_result: "sent", send_error: "" } };`),
    inline(
      "Row after send failed",
      [1560, 20],
      `const d = $('Follow-up engine').item.json;
const err = $json.error || {};
return { json: { ...d, final_row: d.row_failed, send_result: "failed", send_error: String(err.description || err.message || JSON.stringify(err) || "unknown").slice(0, 300) } };`,
    ),
    inline("Row (no message)", [1040, 200], `return { json: { ...$json, final_row: $json.row, send_result: "none", send_error: "" } };`),
    saveRow("Update CRM row", [1820, 60]),
    mail(
      "Alert: CRM update failed",
      [2100, 160],
      ERRORS_TO,
      "TW-09 alert: could not update the CRM sheet",
      "={{ 'The follow-up flow could not write to the Google Sheet.\\n\\nLead: ' + $('Follow-up engine').item.json.row['Lead ID'] + '\\nError: ' + ($json.error ? ($json.error.message || JSON.stringify($json.error)) : 'unknown') }}",
    ),
    ifNode("Alert the team?", [1820, 320], "={{ $json.has_alert }}"),
    teamAlert("Email alert to team", [2100, 320]),
    logRow("Log: follow-up", [1820, -140], {
      Timestamp: nowIst,
      "Lead ID": "={{ $json.row['Lead ID'] }}",
      Channel: "={{ $json.row.Channel }}",
      Step: "follow-up",
      Result: "={{ $json.action + ' / ' + $json.send_result }}",
      Detail: "={{ $json.send_error || $json.row.Status }}",
    }),
    mail(
      "Alert: follow-up failed",
      [1820, 480],
      ERRORS_TO,
      "={{ 'TW-09 alert: follow-up failed - ' + $json.row.Name }}",
      "={{ 'A follow-up could not be sent.\\n\\nLead: ' + $json.row['Lead ID'] + '\\nChannel: ' + $json.row.Channel + '\\nError: ' + $json.send_error + '\\n\\nContact the customer personally if it is still worth pursuing.' }}",
    ),
  ],
  connections: {},
  settings,
};
{
  const c = tw09.connections;
  link(c, "Hourly, 09:00-21:00 IST", [["Read CRM leads"]]);
  link(c, "Read CRM leads", [["Follow-up engine"]]);
  link(c, "Follow-up engine", [["Message to send?"]]);
  link(c, "Message to send?", [["How to send?"], ["Row (no message)"]]);
  link(c, "How to send?", [["Send WhatsApp follow-up"], ["Send Instagram / Facebook follow-up"], ["Brand the follow-up email"]]);
  link(c, "Brand the follow-up email", [["Send email follow-up"]]);
  for (const send of ["Send WhatsApp follow-up", "Send Instagram / Facebook follow-up", "Send email follow-up"]) {
    link(c, send, [["Row after send OK"], ["Row after send failed"]]);
  }
  link(c, "Row after send OK", [["Update CRM row", "Alert the team?", "Log: follow-up"]]);
  link(c, "Row after send failed", [["Update CRM row", "Alert the team?", "Log: follow-up", "Alert: follow-up failed"]]);
  link(c, "Row (no message)", [["Update CRM row", "Alert the team?", "Log: follow-up"]]);
  link(c, "Update CRM row", [[], ["Alert: CRM update failed"]]);
  link(c, "Alert the team?", [["Email alert to team"], []]);
}

const files = {
  "tw-08-leads-inbound-lead-hub.json": tw08,
  "tw-09-leads-follow-up-and-close-out.json": tw09,
};
for (const [file, wf] of Object.entries(files)) {
  writeFileSync(path.join(OUT, file), `${JSON.stringify({ ...wf, pinData: {} }, null, 2)}\n`);
}
writeFileSync(path.join(OUT, "crm-leads-sheet-columns.csv"), `${COLUMNS.join(",")}\n`);
writeFileSync(path.join(OUT, "crm-log-sheet-columns.csv"), `${LOG_COLUMNS.join(",")}\n`);
console.log("wrote", Object.keys(files).join(", "), `(${tw08.nodes.length} + ${tw09.nodes.length} nodes)`);
