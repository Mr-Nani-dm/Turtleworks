import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reviewSubmissions, formatReportDate, buildUnansweredReminder, buildWeeklySummary, buildMonthlyReport } from "./reports.mjs";

const N8N = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOW = Date.parse("2026-10-01T03:30:00Z");
const EMAILS = ["owner@example.test", "colleague@example.test"];
const row = (lead_id, overrides = {}) => ({ lead_id, name: "Example", email: "customer@example.test", received_at: "2026-09-29T05:00:00Z", status: "new", topic_hint: "Website", ...overrides });
const period = {
  projectId: "example-project", teamId: "example-team", label: "September 2026",
  since: "2026-08-31T18:30:00.000Z", until: "2026-09-30T18:29:59.999Z",
  analyticsSince: "2026-09-02T03:30:00.000Z", analyticsUntil: "2026-09-30T18:29:59.999Z",
};
const analytics = {
  count: { data: { visitors: 24, pageviews: 41 } },
  pages: { data: [{ requestPath: "/", visitors: 33, pageviews: 51 }, { requestPath: "/privacy", visitors: 3, pageviews: 4 }] },
  referrers: { data: [] }, countries: { data: [] },
};
const monthly = (extra = {}) => buildMonthlyReport({ period, leads: [], deals: [], analytics, selfAssociatedEmails: EMAILS, now: NOW, ...extra });
const load = (prefix) => JSON.parse(readFileSync(path.join(N8N, readdirSync(N8N).find((f) => f.startsWith(prefix) && f.endsWith(".json"))), "utf8"));
function runCode(prefix, name, rows = [], named = {}, configured = false, now = NOW) {
  let code = load(prefix).nodes.find((n) => n.name === name).parameters.jsCode;
  if (configured) code = code.replace("const SELF_ASSOCIATED_EMAILS = [];", `const SELF_ASSOCIATED_EMAILS = ${JSON.stringify(EMAILS)};`);
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const $ = (key) => {
    if (!(key in named)) throw new Error(`Missing node: ${key}`);
    const items = named[key].map((json) => ({ json }));
    return { first: () => items[0], all: () => items };
  };
  return new Function("$input", "$", "Date", code)({ all: () => rows.map((json) => ({ json })) }, $, FixedDate);
}

test("exact email review normalises case/whitespace only; no name, domain or alias guesses", () => {
  const rows = [row("self", { email: " OWNER@EXAMPLE.TEST " }), row("same-name", { name: "owner" }), row("same-domain", { email: "new@example.test" }), row("alias", { email: "owner+sales@example.test" }), row("missing", { email: "" })];
  const snapshot = structuredClone(rows);
  const review = reviewSubmissions(rows, EMAILS);
  assert.deepEqual(review.selfAssociated.map((r) => r.lead_id), ["self"]);
  assert.equal(review.other.length, 4);
  assert.deepEqual(rows, snapshot);
  assert.throws(() => reviewSubmissions(rows, ["@example.test"]), /complete email addresses/);
  assert.throws(() => reviewSubmissions(rows, "owner@example.test"), /array/);
});

test("unconfigured email review is disclosed instead of claiming zero self/test submissions", () => {
  const review = reviewSubmissions([row("one")]);
  assert.match(review.configurationNote, /not configured/);
  assert.match(buildWeeklySummary([row("one")], [], NOW).body, /not configured/);
  assert.match(monthly({ leads: [row("one")], selfAssociatedEmails: [] }).body, /not configured/);
});

test("reminder separates self-associated review from other submissions without status writes", () => {
  const rows = [row("self", { email: EMAILS[0] }), row("other"), row("replied", { status: "replied" }), row("young", { received_at: new Date(NOW - 3600e3).toISOString() }), row("blank-status", { status: "" })];
  const snapshot = structuredClone(rows);
  const report = buildUnansweredReminder(rows, EMAILS, NOW);
  assert.equal(report.subject, "3 website submissions need attention");
  assert.match(report.body, /OTHER SUBMISSIONS — UNREVIEWED \(2 older/);
  assert.match(report.body, /SELF-ASSOCIATED SUBMISSIONS — NEEDS REVIEW \(1 older/);
  assert.doesNotMatch(report.body, /• replied|• young/);
  assert.match(report.body, /not a confirmed test/);
  assert.deepEqual(rows, snapshot);
});

test("reminder is silent when clear; invalid timestamps remain visible for review", () => {
  assert.equal(buildUnansweredReminder([{}, row("done", { status: "won" })], EMAILS, NOW), null);
  assert.equal(formatReportDate(null), "unknown date");
  assert.equal(formatReportDate(""), "unknown date");
  assert.match(buildUnansweredReminder([row("null-time", { received_at: null })], EMAILS, NOW).body, /Received unknown date/);
  const report = buildUnansweredReminder([row("undated", { received_at: "garbage", email: EMAILS[0] })], EMAILS, NOW);
  assert.match(report.body, /MISSING\/INVALID RECEIVED TIME/);
  assert.match(report.body, /Email review: self-associated/);
});

test("weekly summary uses bounded dates, neutral record counts and safe topic/status keys", () => {
  const report = buildWeeklySummary([
    row("self", { email: EMAILS[0] }), row("other", { status: "qualified", topic_hint: "__proto__" }),
    row("future", { received_at: new Date(NOW + 1).toISOString() }),
    row("old", { received_at: new Date(NOW - 7 * 864e5 - 1).toISOString() }),
    row("bad-date", { received_at: "invalid" }),
  ], EMAILS, NOW);
  assert.match(report.body, /Raw submissions this week: 2/);
  assert.match(report.body, /Self-associated — needs review: 1/);
  assert.match(report.body, /Other submissions — unreviewed: 1/);
  assert.match(report.body, /__proto__: 1/);
  assert.match(report.body, /qualified: 1/);
  assert.match(report.body, /not independently verified/);
  assert.match(report.body, /Missing\/invalid received time, excluded from period: 1/);
});

test("monthly regression: four self-associated records do not become a 16.7% conversion claim", () => {
  const leads = [row("one", { email: EMAILS[0] }), row("two", { email: EMAILS[1] }), row("three", { email: EMAILS[0] }), row("four", { email: EMAILS[1] })];
  const snapshot = structuredClone(leads);
  const report = monthly({ leads });
  assert.match(report.body, /Raw submissions this month: 4/);
  assert.match(report.body, /Self-associated — needs review: 4/);
  assert.match(report.body, /Other submissions — unreviewed: 0/);
  assert.match(report.body, /Enquiry\/conversion rate: not calculated/);
  assert.doesNotMatch(report.body, /16\.7|% of visitors/);
  assert.match(report.body, /top-page visitor count exceeds/);
  assert.match(report.body, /top-page view count exceeds/);
  assert.match(report.body, /top-page views sum to more/);
  assert.match(report.body, /windows differ/);
  assert.match(report.body, /Environment filter: not set/);
  assert.match(report.body, /not the LeadHub Google Sheet/);
  assert.deepEqual(leads, snapshot);
});

test("matching windows still do not prove visitor-to-person attribution; visitors are never summed", () => {
  const report = monthly({ period: { ...period, analyticsSince: period.since }, analytics: { ...analytics, pages: { data: [{ requestPath: "/", visitors: 20, pageviews: 20 }, { requestPath: "/other", visitors: 20, pageviews: 20 }] } } });
  assert.doesNotMatch(report.body, /windows differ|totals need reconciliation/);
  assert.match(report.body, /not calculated/);
});

test("missing, malformed or failed headline data is not silently reported as zero", () => {
  for (const count of [{}, { data: {} }, { data: { visitors: -1, pageviews: 1 } }, { data: { visitors: "24", pageviews: 41 } }, { error: { message: "Unauthorised" } }]) {
    const report = monthly({ analytics: { ...analytics, count } });
    assert.match(report.body, /Analytics headline unavailable/);
    assert.doesNotMatch(report.body, /Returned visitors:|Returned page views:/);
  }
  const report = monthly({ analytics: { count: { data: { visitors: 0, pageviews: 0 } }, pages: { error: { message: "query failed" } } } });
  assert.match(report.body, /Returned visitors: 0/);
  assert.match(report.body, /Unavailable: query failed/);
  assert.match(report.body, /Unavailable: no aggregate data returned/);
});

test("all aggregate groups flag inconsistent and malformed numbers without crashing", () => {
  const report = monthly({ analytics: { ...analytics, pages: { data: [null] }, referrers: { data: [{ referrerHostname: "example.test", visitors: 30, pageviews: 100 }] }, countries: { data: [{ country: "IN", visitors: 40, pageviews: 150 }] } } });
  assert.match(report.body, /Malformed top-page metrics/);
  assert.match(report.body, /No valid aggregate rows/);
  assert.match(report.body, /top-referrer visitor count exceeds/);
  assert.match(report.body, /top-country view count exceeds/);
});

test("monthly period includes IST boundaries and preserves deal/status calculations", () => {
  const report = monthly({ leads: [row("start", { received_at: period.since }), row("end", { received_at: period.until }), row("outside", { received_at: "2026-09-30T18:30:00Z" })], deals: [{ deal_id: "proposal", proposal_sent_on: period.since, proposal_status: "sent", value_inr: 100 }, { deal_id: "invoice", invoice_issued_on: period.until, invoice_status: "unpaid", invoice_amount_inr: 250, invoice_due_on: "2026-09-15" }] });
  assert.match(report.body, /Raw submissions this month: 2/);
  assert.match(report.body, /Proposals sent: 1/);
  assert.match(report.body, /Proposals awaiting decision: 1/);
  assert.match(report.body, /Invoices issued: 1/);
  assert.match(report.body, /Unpaid invoices: 1 .*1 overdue/);
});

test("period code clamps retention windows to last month, including late manual runs", () => {
  for (const timestamp of [NOW, Date.parse("2026-10-31T12:00:00Z"), Date.parse("2027-01-01T03:30:00Z"), Date.parse("2028-03-01T03:30:00Z")]) {
    const [{ json: p }] = runCode("tw-06-", "Work out last month (IST)", [], {}, false, timestamp);
    assert.ok(Date.parse(p.analyticsSince) >= Date.parse(p.since));
    assert.ok(Date.parse(p.analyticsSince) <= Date.parse(p.until));
    assert.equal(p.analyticsUntil, p.until);
  }
  const [{ json: p }] = runCode("tw-06-", "Work out last month (IST)", [], {}, false, Date.parse("2026-10-31T12:00:00Z"));
  const report = monthly({ period: p });
  assert.match(report.body, /No valid analytics window/);
  assert.doesNotMatch(report.body, /Returned visitors:|Returned top pages:/);
});

test("generated Code nodes run with configured synthetic emails and no writes", () => {
  const rows = [row("self", { email: EMAILS[0] }), row("other")];
  assert.match(runCode("tw-02-", "Find enquiries awaiting a reply", rows, {}, true)[0].json.body, /SELF-ASSOCIATED SUBMISSIONS — NEEDS REVIEW \(1/);
  assert.match(runCode("tw-03-", "Summarise the last 7 days", rows, {}, true)[0].json.body, /Self-associated — needs review: 1/);
  const named = { "Work out last month (IST)": [period], "Read all leads": rows, "Read all deals": [{}], "Vercel · visitors & page views": [analytics.count], "Vercel · top pages": [analytics.pages], "Vercel · top referrers": [analytics.referrers], "Vercel · top countries": [analytics.countries] };
  assert.match(runCode("tw-06-", "Compose monthly report", [], named, true)[0].json.body, /Self-associated — needs review: 1/);
  delete named["Read all leads"];
  assert.throws(() => runCode("tw-06-", "Compose monthly report", [], named), /Missing node/);
  for (const prefix of ["tw-02-", "tw-03-", "tw-06-"]) {
    const wf = load(prefix);
    assert.ok(wf.nodes.filter((n) => n.type.endsWith(".dataTable")).every((n) => n.parameters.operation === "get"));
    assert.ok(wf.nodes.filter((n) => n.type.endsWith(".code") && n.name !== "Work out last month (IST)").every((n) => n.parameters.jsCode.includes("const SELF_ASSOCIATED_EMAILS = [];")));
  }
});

test("all generated core workflows and table schemas reproduce exactly", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "tw-reports-test-"));
  try {
    execFileSync(process.execPath, [path.join(N8N, "build-core.mjs")], { env: { ...process.env, OUT: dir } });
    for (const file of readdirSync(dir)) assert.equal(readFileSync(path.join(dir, file), "utf8"), readFileSync(path.join(N8N, file), "utf8"), file);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
