// Pure, read-only helpers. build-core.mjs embeds these into n8n Code nodes.
// All fixtures and repository configuration must remain free of private emails.
export function reviewSubmissions(rows, selfAssociatedEmails = []) {
  if (!Array.isArray(selfAssociatedEmails) || selfAssociatedEmails.some((v) => typeof v !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))) {
    throw new Error("SELF_ASSOCIATED_EMAILS must be an array of complete email addresses");
  }
  const normalise = (v) => String(v ?? "").trim().toLowerCase();
  const emails = new Set(selfAssociatedEmails.map(normalise));
  const all = rows.filter((r) => r && r.lead_id);
  const isSelfAssociated = (r) => emails.has(normalise(r.email));
  const selfAssociated = all.filter(isSelfAssociated);
  const other = all.filter((r) => !isSelfAssociated(r));
  const isNew = (r) => normalise(r.status || "new") === "new";
  return {
    all, selfAssociated, other, isSelfAssociated, isNew,
    configurationNote: emails.size
      ? "Self-associated means an exact configured email match, not a confirmed test. Other submissions are unreviewed; neither group establishes a genuine or qualified client."
      : "Self-associated email review is not configured. All submissions remain unreviewed; no genuine or qualified client count is established.",
  };
}

export function formatReportDate(value) {
  if (value == null || value === "") return "unknown date";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST"
    : "unknown date";
}

export function buildUnansweredReminder(rows, selfAssociatedEmails = [], now = Date.now()) {
  const review = reviewSubmissions(rows, selfAssociatedEmails);
  const cutoff = now - 20 * 3600e3;
  const pending = review.all.filter(review.isNew).filter((r) => Date.parse(r.received_at) < cutoff)
    .sort((a, b) => Date.parse(a.received_at) - Date.parse(b.received_at));
  const selfAssociated = pending.filter(review.isSelfAssociated);
  const other = pending.filter((r) => !review.isSelfAssociated(r));
  const undated = review.all.filter((r) => review.isNew(r) && !Number.isFinite(Date.parse(r.received_at)));
  if (!pending.length && !undated.length) return null;
  const line = (r) => `• ${r.lead_id} — ${r.name || "—"}${r.company ? ` (${r.company})` : ""} <${r.email || "—"}>\n  Received ${formatReportDate(r.received_at)} · recorded status: ${r.status || "missing (handled as new)"} · ${r.topic_hint || "Unclassified"}`;
  return {
    subject: `${pending.length + undated.length} website submissions need attention`,
    body: [
      "Website submission review (source: n8n Data table: TW Leads — website enquiries)",
      "Records below are still marked new (or have no status) after 20 hours, or need their timestamp reviewed.",
      review.configurationNote,
      "",
      `OTHER SUBMISSIONS — UNREVIEWED (${other.length} older than 20 hours)`,
      ...other.map(line),
      other.length ? 'Review each enquiry and reply where appropriate. After replying, set its status to "replied" in the source table.' : "  —",
      "",
      `SELF-ASSOCIATED SUBMISSIONS — NEEDS REVIEW (${selfAssociated.length} older than 20 hours)`,
      ...selfAssociated.map(line),
      selfAssociated.length ? "Review these separately before treating them as client follow-ups. Email ownership alone does not prove a test." : "  —",
      "",
      ...(undated.length ? [`MISSING/INVALID RECEIVED TIME — NEEDS REVIEW (${undated.length})`, ...undated.map((r) => `${line(r)}\n  Email review: ${review.isSelfAssociated(r) ? "self-associated" : "other/unreviewed"}`), ""] : []),
      "This report does not change or delete any record or status.",
    ].join("\n"),
  };
}

export function buildWeeklySummary(rows, selfAssociatedEmails = [], now = Date.now()) {
  const review = reviewSubmissions(rows, selfAssociatedEmails);
  const since = now - 7 * 864e5;
  const week = review.all.filter((r) => { const t = Date.parse(r.received_at); return t >= since && t <= now; });
  const current = reviewSubmissions(week, selfAssociatedEmails);
  const tally = (list, key) => {
    const counts = new Map();
    for (const r of list) for (const value of String(r[key] || "Unspecified").split(", ")) counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `  ${k}: ${n}`).join("\n") || "  —";
  };
  const undated = review.all.filter((r) => !Number.isFinite(Date.parse(r.received_at))).length;
  return {
    subject: `TurtleWorks weekly submissions — ${week.length} received`,
    body: [
      `Website submissions, ${formatReportDate(since)} – ${formatReportDate(now)}`,
      'Source: n8n Data table: "TW Leads — website enquiries". Counts are submission records, not unique people.',
      review.configurationNote,
      "",
      `Raw submissions this week: ${week.length}`,
      `Self-associated — needs review: ${current.selfAssociated.length}`,
      `Other submissions — unreviewed: ${current.other.length}`,
      `Other records new or missing status (all time): ${review.other.filter(review.isNew).length}`,
      `Self-associated records new or missing status (all time): ${review.selfAssociated.filter(review.isNew).length}`,
      `Total submission records (all time): ${review.all.length}`,
      `Missing/invalid received time, excluded from period: ${undated}`,
      "",
      "Topics on other submissions (keyword hints only; a record can have multiple topics):",
      tally(current.other, "topic_hint"),
      "",
      "Recorded statuses on other submissions (not independently verified):",
      tally(current.other, "status"),
      "",
      ...week.slice().sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at)).map((r) => `• ${r.lead_id} · ${formatReportDate(r.received_at)} · ${r.name || "—"} · recorded status: ${r.status || "missing (handled as new)"} · ${review.isSelfAssociated(r) ? "self-associated / needs review" : "other / unreviewed"}`),
    ].join("\n"),
  };
}

export function buildMonthlyReport({ period, leads, deals, analytics, selfAssociatedEmails = [], now = Date.now() }) {
  const from = Date.parse(period.since);
  const to = Date.parse(period.until);
  const inPeriod = (value) => { const t = Date.parse(value); return Number.isFinite(t) && t >= from && t <= to; };
  const review = reviewSubmissions(leads, selfAssociatedEmails);
  const month = reviewSubmissions(review.all.filter((r) => inPeriod(r.received_at)), selfAssociatedEmails);
  const lc = (v) => String(v ?? "").trim().toLowerCase();
  const inr = (n) => Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const metric = (v) => Number.isSafeInteger(v) && v >= 0;
  const problem = (r) => r?.error ? String(r.error.message || r.error.code || "API error") : null;
  const count = analytics.count || {};
  const validHeadline = !problem(count) && metric(count.data?.visitors) && metric(count.data?.pageviews);
  const visitors = validHeadline ? count.data.visitors : null;
  const pageviews = validHeadline ? count.data.pageviews : null;
  const warnings = [];
  const analyticsFrom = Date.parse(period.analyticsSince);
  const analyticsTo = Date.parse(period.analyticsUntil);
  const validWindow = Number.isFinite(analyticsFrom) && Number.isFinite(analyticsTo) && analyticsFrom < analyticsTo && analyticsFrom >= from && analyticsTo <= to;
  if (!validWindow) warnings.push("No valid analytics window within the requested month; analytics numbers are withheld.");
  else if (analyticsFrom !== from || analyticsTo !== to) warnings.push("Analytics and submission windows differ; the analytics query covers only part of the month.");
  if (!validHeadline) warnings.push(`Analytics headline unavailable: ${problem(count) || "missing/invalid visitors or pageviews"}. Missing metrics are not treated as zero.`);
  const aggregateRows = (response) => Array.isArray(response?.data) ? response.data.filter((r) => r && typeof r === "object" && !Array.isArray(r)) : [];
  const pageRows = aggregateRows(analytics.pages);
  const groups = [["page", analytics.pages], ["referrer", analytics.referrers], ["country", analytics.countries]];
  for (const [label, response] of groups) {
    const rows = aggregateRows(response);
    if (Array.isArray(response?.data) && (rows.length !== response.data.length || rows.some((r) => !metric(r.visitors) || !metric(r.pageviews)))) warnings.push(`Malformed top-${label} metrics; unknown values are not treated as zero.`);
    if (validHeadline) {
      if (rows.some((r) => metric(r.visitors) && r.visitors > visitors)) warnings.push(`A top-${label} visitor count exceeds headline visitors; analytics totals need reconciliation.`);
      if (rows.some((r) => metric(r.pageviews) && r.pageviews > pageviews)) warnings.push(`A top-${label} view count exceeds headline page views; analytics totals need reconciliation.`);
    }
  }
  if (validHeadline) {
    if (visitors > pageviews) warnings.push("Headline visitors exceed page views; analytics totals need reconciliation.");
    const paths = pageRows.map((r) => r.requestPath);
    if (pageRows.length && paths.every((p) => typeof p === "string") && new Set(paths).size === paths.length && pageRows.every((r) => metric(r.pageviews)) && pageRows.reduce((s, r) => s + r.pageviews, 0) > pageviews) {
      warnings.push("Returned top-page views sum to more than headline page views; analytics totals need reconciliation.");
    }
  }
  const top = (response, key, max) => {
    if (problem(response) || !Array.isArray(response?.data)) return `  Unavailable: ${problem(response) || "no aggregate data returned"}`;
    return aggregateRows(response).slice(0, max).map((r) => `  ${String(r[key] ?? "(none)")} · ${metric(r.pageviews) ? r.pageviews : "unknown"} views · ${metric(r.visitors) ? r.visitors : "unknown"} visitors`).join("\n") || (response.data.length ? "  No valid aggregate rows" : "  No rows returned");
  };
  const allDeals = deals.filter((r) => r && (r.client_name || r.deal_id));
  const proposalsSent = allDeals.filter((r) => inPeriod(r.proposal_sent_on));
  const openProposals = allDeals.filter((r) => lc(r.proposal_status) === "sent");
  const invoicesIssued = allDeals.filter((r) => inPeriod(r.invoice_issued_on));
  const unpaid = allDeals.filter((r) => lc(r.invoice_status) === "unpaid");
  const overdue = unpaid.filter((r) => r.invoice_due_on && Date.parse(r.invoice_due_on) < now);
  const sum = (list, key) => list.reduce((s, r) => s + Number(r[key] || 0), 0);
  const topics = new Map();
  for (const r of month.other) for (const t of String(r.topic_hint || "Unclassified").split(", ")) topics.set(t, (topics.get(t) || 0) + 1);
  return {
    subject: `TurtleWorks monthly report — ${period.label}`,
    body: [
      `TurtleWorks — ${period.label}`,
      "",
      "WEBSITE (Vercel Web Analytics; returned project-query metrics, not verified conversions)",
      `  Project: ${period.projectId}; team: ${period.teamId}`,
      "  Environment filter: not set in this workflow query",
      `  Requested analytics window: ${period.analyticsSince} – ${period.analyticsUntil}`,
      `  Submission/deal window: ${period.since} – ${period.until} (calendar month in Asia/Kolkata)`,
      ...warnings.map((w) => `  REVIEW: ${w}`),
      ...(validWindow && validHeadline ? [`  Returned visitors: ${visitors}`, `  Returned page views: ${pageviews}`] : []),
      "  Enquiry/conversion rate: not calculated. Submission records are not unique verified enquirers and are not linked to analytics visitors.",
      ...(validWindow ? ["", "  Returned top pages:", top(analytics.pages, "requestPath", 8), "", "  Returned top referrers:", top(analytics.referrers, "referrerHostname", 6), "", "  Returned top countries:", top(analytics.countries, "country", 6)] : []),
      "",
      "WEBSITE SUBMISSIONS",
      '  Source: n8n Data table: "TW Leads — website enquiries" (not the LeadHub Google Sheet)',
      `  Raw submissions this month: ${month.all.length}`,
      `  Self-associated — needs review: ${month.selfAssociated.length}`,
      `  Other submissions — unreviewed: ${month.other.length}`,
      `  Other records new or missing status (all time): ${review.other.filter(review.isNew).length}`,
      `  Self-associated records new or missing status (all time): ${review.selfAssociated.filter(review.isNew).length}`,
      `  Missing/invalid received time, excluded from period: ${review.all.filter((r) => !Number.isFinite(Date.parse(r.received_at))).length}`,
      `  ${review.configurationNote}`,
      "  Counts are submission records, not unique people. No records or statuses are changed.",
      "  Topics on other submissions (keyword hints; one record can have multiple):",
      ...[...topics].sort((a, b) => b[1] - a[1]).map(([t, n]) => `  · ${t}: ${n}`),
      "",
      "PROPOSALS & INVOICES (recorded values in TW Deals)",
      `  Proposals sent: ${proposalsSent.length} (${inr(sum(proposalsSent, "value_inr"))})`,
      `  Proposals awaiting decision: ${openProposals.length} (${inr(sum(openProposals, "value_inr"))}); current/all time`,
      `  Invoices issued: ${invoicesIssued.length} (${inr(sum(invoicesIssued, "invoice_amount_inr"))})`,
      `  Unpaid invoices: ${unpaid.length} (${inr(sum(unpaid, "invoice_amount_inr"))}), ${overdue.length} overdue; current/all time as of ${formatReportDate(now)}`,
    ].join("\n"),
  };
}
