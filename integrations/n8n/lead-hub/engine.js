// TurtleWorks lead engine. One decision per inbound message:
// what the CRM row becomes, what (if anything) we send back, and who to alert.
// Nothing here sends a proposal or a payment link; those stay human-only.

const OWNER = "Narendra";
const ROUTES = {
  general: "hello@turtleworks.in",
  projects: "projects@turtleworks.in",
  accounts: "accounts@turtleworks.in",
  support: "support@turtleworks.in",
};
const GRAPH = "https://graph.facebook.com/v21.0";
const WA_PHONE_NUMBER_ID = "__WA_PHONE_NUMBER_ID__";
const WELCOME_TEMPLATE = "tw_welcome";
const TEMPLATE_LANG = "en";
const SITE_GREETING = "Hi TurtleWorks, I'd like to talk about a problem in my business.";

const SERVICES = ["Website design", "Business automation", "Dashboard / FinOps", "SEO / content", "Not sure"];
const PROJECT_SERVICES = ["Website design", "Business automation", "Dashboard / FinOps"];
const HOLD = ["Call Requested", "Proposal Drafted", "Payment Pending", "Needs Human Review"];
const CLOSED = ["Call Booked", "Proposal Sent", "Won", "Project Started", "Delivered", "Review Requested", "Lost", "Not Now"];
const AWAITING = ["Auto Reply Sent", "Questionnaire Started"];
const RANK = { Cold: 0, Warm: 1, Hot: 2 };
const HOUR = 3600e3;

const QUESTIONS = [
  "What type of business do you run?",
  "Do you already have a website or system?",
  "What is the main issue you want to fix?",
  "How soon do you want to start?",
  "Would you like a quick 10-minute call?",
];
const menu = (name) =>
  `Hi ${name}, welcome to TurtleWorks. Thanks for reaching out.\n\nWe help businesses with websites, automation, dashboards, FinOps visibility, SEO, and digital workflows.\n\nWhat would you like help with?\n1. Website design\n2. Business automation\n3. Dashboard / FinOps\n4. SEO / content\n5. Not sure, need guidance`;
const CALL_YES = "Great, thank you. Our team will get back to you here to confirm a time for the call.";
const CALL_NO = "Thank you, that helps. Our team will review what you've shared and get back to you here.";
const OPT_OUT = "Understood. We won't send you any more automated messages. You can message us any time if you change your mind.";

const KEYWORDS = [
  ["Website design", /\b(website|web ?site|web design|landing page|redesign|shopify|wordpress|logo|brand(?:ing)?)\b/g],
  ["Business automation", /\b(automat\w*|whatsapp|chatbot|reminders?|invoices?|workflows?|crm|zapier|n8n|app|software|booking|portal|erp|inventory|spreadsheets?)\b/g],
  ["Dashboard / FinOps", /\b(dashboards?|reports?|analytics|kpi|finops|cloud|azure|aws|power ?bi|tracking)\b/g],
  ["SEO / content", /\b(seo|geo|google (?:ranking|search|ads)|rank(?:ing)?|chatgpt|content|social media|instagram|facebook|marketing|posts?|reels?|ads)\b/g],
];
const HOT = /\b(call me|call back|give me a call|phone call|schedule a call|book a call|arrange a call|can we (?:talk|speak)|talk to (?:someone|you)|speak (?:to|with)|price|pricing|cost|quote|quotation|how much|rates?|proposal|urgent|asap|immediately|right away|at the earliest)\b/i;
const YES = /^\s*(yes|yeah|yep|yup|sure|ok(?:ay)?|please|haan|ha|definitely|of course|y)\b/i;
const NO = /^\s*(no|nope|nah|not now|not really|maybe later|later|n)\b/i;
const STOP = /^\s*(stop|unsubscribe|opt[- ]?out|remove me)\s*[.!]?\s*$/i;
const PAYMENT = /\b(payments?|invoices?|billing|receipts?|gst|refunds?)\b/i;
const ESCALATE = /\b(existing client|already (?:a )?client|support ticket|site is down|website is down|not working|is broken|payments?|receipts?|refunds?|billing|gst)\b/i;
const SUPPORT = /\b(existing client|already (?:a )?client|our project|my project|support ticket|site is down|website is down|not working|is broken|bug)\b/i;

const guessService = (t) => {
  let best = "";
  let bestN = 0;
  for (const [service, re] of KEYWORDS) {
    const n = (String(t).toLowerCase().match(re) || []).length;
    if (n > bestN) {
      best = service;
      bestN = n;
    }
  }
  return best;
};
const chooseService = (t) => {
  const s = String(t).trim().toLowerCase();
  const m = s.match(/^\s*(?:option\s*)?([1-5])\b/);
  if (m) return SERVICES[Number(m[1]) - 1];
  if (/not sure|guidance|don'?t know|unsure/.test(s)) return "Not sure";
  return guessService(s);
};
const urgencyOf = (t) =>
  /\b(asap|urgent|immediately|right away|today|tomorrow|this week|now)\b/i.test(t) ? "High"
  : /\b(later|no rush|exploring|browsing|just looking|next year|few months)\b/i.test(t) ? "Low"
  : "";
const budgetOf = (t) => {
  const m = String(t).match(/(?:₹|rs\.?|inr)\s*[\d,.]+\s*(?:k|l|lakhs?|cr|crores?)?|[\d,.]+\s*(?:k|lakhs?|crores?)\b/i);
  return m ? m[0].trim().slice(0, 40) : "";
};
const hash = (s) => {
  let h = 5381;
  for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return h.toString(36).toUpperCase().padStart(6, "0");
};
const ist = (ms) => new Date(ms + 330 * 60000).toISOString().slice(0, 16).replace("T", " ");
const firstOf = (n) => (String(n || "").split(/\s+/)[0] || "").replace(/[^\p{L}'-]/gu, "").slice(0, 40) || "there";
const add = (base, piece) => [base, piece].filter(Boolean).join(" | ").slice(0, 900);

const waBody = (to, text) => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "text",
  text: { preview_url: false, body: text },
});
const waTemplateBody = (to, name, params) => ({
  messaging_product: "whatsapp",
  to,
  type: "template",
  template: {
    name,
    language: { code: TEMPLATE_LANG },
    components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
  },
});

const sendFor = (inbound, phone, first, text) => {
  if (!text) return null;
  const wa = `${GRAPH}/${WA_PHONE_NUMBER_ID}/messages`;
  if (inbound.channel === "WhatsApp") return { via: "whatsapp", url: wa, body: waBody(inbound.phone, text) };
  if (inbound.channel === "Instagram" || inbound.channel === "Facebook")
    return { via: "dm", url: `${GRAPH}/me/messages`, body: { recipient: { id: inbound.sender_id }, messaging_type: "RESPONSE", message: { text } } };
  if (inbound.channel === "Email")
    return {
      via: "email",
      to: inbound.email,
      subject: `Re: ${inbound.subject || "your enquiry"}`,
      message: `${text}\n\nTurtleWorks\nhttps://www.turtleworks.in`,
      message_id: inbound.message_id,
    };
  if (inbound.channel === "Website" && phone) return { via: "whatsapp", url: wa, body: waTemplateBody(phone, WELCOME_TEMPLATE, [first]) };
  return null;
};

const REASONS = {
  new_lead: ["New", "None yet. The automated questions are running; you will be alerted when the lead is qualified."],
  qualified: ["Qualified", "Review the summary, then decide: book a call or draft a proposal. Automation has finished for this lead."],
  call_requested: ["Call requested", "Contact them to confirm a time for the call. Automated messages are paused."],
  needs_review: ["Needs human review", "Read the conversation and reply personally. Automated messages are paused."],
  replied_while_paused: ["Customer replied", "Reply personally. To resume automation, set Automation Paused to No in the CRM."],
  customer_replied: ["Customer replied", "Reply personally."],
  repeat_enquiry: ["Repeat enquiry", "The same person enquired again; see the updated summary."],
  opt_out: ["Opted out", "This person asked us to stop. No further automated messages will be sent."],
  hot_lead: ["Hot lead", "Contact promptly: they asked about a call, pricing, a proposal or an urgent timeline."],
  escalation: ["Attention needed", "This message mentions payments or existing-project support. Please review."],
};

function decide(inbound, prev, now) {
  const isNew = !prev;
  prev = prev || {};
  const channel = inbound.channel;
  const isWebsite = channel === "Website";
  const isChat = channel === "WhatsApp" || channel === "Instagram" || channel === "Facebook";
  const text = inbound.text || "";
  const phone = inbound.phone || String(prev.Phone || "").replace(/\D/g, "");
  const name = prev.Name || inbound.name || "";
  const first = firstOf(name || inbound.first_name);
  const prevStatus = prev.Status || "";
  const step = Number(prev.Step) || 0;
  const paused = String(prev["Automation Paused"]) === "Yes";

  if (!isNew && inbound.message_id && String(prev["Last Message ID"]) === String(inbound.message_id)) {
    return { skip: true, reason: "duplicate message" };
  }

  let status = prevStatus || "New Lead";
  let stepNext = step;
  let reply = "";
  let reason = "";
  let pausedNext = paused;
  let priority = RANK[prev.Priority] !== undefined ? prev.Priority : "Cold";
  let service = prev["Service Interest"] || "";
  let biz = prev["Business Type"] || "";
  let req = prev["Requirement Summary"] || "";
  let urgency = prev.Urgency || "";
  let budget = prev["Budget Range"] || "";
  let notes = prev.Notes || "";
  let templateSend = false;

  const startPriority = priority;
  const bump = (p) => {
    if (RANK[p] > RANK[priority]) priority = p;
  };
  if (HOT.test(text)) bump("Hot");
  budget = budget || budgetOf(text);
  if (urgencyOf(text) === "High") urgency = "High";

  if (STOP.test(text) && !isWebsite) {
    status = "Not Now";
    pausedNext = true;
    stepNext = 99;
    reply = OPT_OUT;
    reason = "opt_out";
  } else if (!isNew && !text && inbound.media_type) {
    status = "Needs Human Review";
    pausedNext = true;
    reason = "needs_review";
    notes = add(notes, `Customer sent a ${inbound.media_type}, which automation cannot read`);
  } else if (isNew) {
    reason = "new_lead";
    if (isWebsite) {
      req = text;
      service = guessService(text);
      if (inbound.company || text.length >= 60) bump("Warm");
      if (phone) {
        reply = "template";
        templateSend = true;
        status = "Auto Reply Sent";
        stepNext = 1;
      } else {
        status = "New Lead";
        stepNext = 0;
      }
    } else {
      if (text && text !== SITE_GREETING && text.length > 15) req = text;
      service = guessService(text);
      reply = menu(first);
      status = "Auto Reply Sent";
      stepNext = 1;
    }
  } else if (isWebsite) {
    req = add(req, text);
    reason = "repeat_enquiry";
  } else if (paused || HOLD.includes(prevStatus) || CLOSED.includes(prevStatus)) {
    if (prevStatus === "Lost" || prevStatus === "Not Now") {
      status = "Needs Human Review";
      pausedNext = true;
    }
    reason = "replied_while_paused";
  } else if (step === 0 || step >= 7) {
    reason = "customer_replied";
  } else if (step === 1) {
    const chosen = chooseService(text);
    service = chosen || "Not sure";
    status = "Questionnaire Started";
    stepNext = 2;
    reply = (chosen ? "" : "No problem, a few quick questions will help us guide you.\n\n") + QUESTIONS[0];
  } else if (step === 2) {
    biz = text.slice(0, 120);
    bump("Warm");
    stepNext = 3;
    reply = QUESTIONS[1];
  } else if (step === 3) {
    req = add(req, `Existing setup: ${text}`);
    stepNext = 4;
    reply = QUESTIONS[2];
  } else if (step === 4) {
    req = add(req, `Main issue: ${text}`);
    if (service === "Not sure") service = guessService(text) || service;
    stepNext = 5;
    reply = QUESTIONS[3];
  } else if (step === 5) {
    urgency = urgencyOf(text) || urgency || "Medium";
    req = add(req, `Timeline: ${text}`);
    stepNext = 6;
    reply = QUESTIONS[4];
  } else if (step === 6) {
    const wantsCall = YES.test(text) || (!NO.test(text) && HOT.test(text));
    stepNext = 7;
    if (wantsCall) {
      bump("Hot");
      status = "Call Requested";
      reply = CALL_YES;
      reason = "call_requested";
    } else {
      bump("Warm");
      status = "Qualified";
      reply = CALL_NO;
      reason = "qualified";
    }
  }

  if (HOLD.includes(status)) pausedNext = true;
  if (!reason && RANK[priority] === 2 && startPriority !== "Hot") reason = "hot_lead";
  if ((!reason || reason === "new_lead") && ESCALATE.test(text)) reason = "escalation";

  const send = reply ? sendFor(inbound, phone, first, templateSend ? "template" : reply) : null;
  const replyForLog = templateSend ? "(WhatsApp welcome template)" : reply;

  const idPart = isChat || channel === "Email"
    ? hash(phone || inbound.sender_id || inbound.email)
    : hash(inbound.lead_id || inbound.email);
  const prefix = { WhatsApp: "WA", Instagram: "IG", Facebook: "FB", Email: "EM", Website: "WS" }[channel];
  const stamp = ist(now).slice(5);
  const line = (who, t) => `[${stamp}] ${who}: ${String(t).replace(/\s+/g, " ").slice(0, 220)}`;
  const cap = (s) => String(s).slice(-2400);
  const customerLog = cap([prev["Conversation Summary"], text ? line("Customer", text) : ""].filter(Boolean).join("\n"));
  const botLog = cap([customerLog, replyForLog ? line("Bot", replyForLog) : ""].filter(Boolean).join("\n"));

  const convChannel = isWebsite ? (phone ? "WhatsApp" : "Email") : channel;
  const fu = Number(prev["Follow-up Count"]) || 0;
  const lastInbound = Number(inbound.received_ms) || now;
  const awaiting = AWAITING.includes(status) && !pausedNext;
  const nextFollow = awaiting ? ist(fu >= 1 ? lastInbound + 72 * HOUR : now + 24 * HOUR) : "";
  const campaign = prev.Campaign || (text === SITE_GREETING ? "Website WhatsApp button" : isWebsite ? "Website form" : "Direct message");

  const base = {
    "Lead ID": prev["Lead ID"] || inbound.lead_id || `${prefix}-${ist(now).slice(0, 10).replace(/-/g, "")}-${idPart}`,
    "Created Date": prev["Created Date"] || ist(now),
    Name: name,
    Phone: phone ? `+${phone}` : prev.Phone || "",
    Email: prev.Email || inbound.email || "",
    Source: prev.Source || inbound.source,
    Channel: reason === "repeat_enquiry" ? prev.Channel : convChannel,
    "Lead Type": "Inbound",
    Campaign: campaign,
    "Service Interest": service,
    "Business Type": biz,
    "Requirement Summary": req,
    Urgency: urgency,
    "Budget Range": budget,
    "Estimated Value": prev["Estimated Value"] || "",
    Status: status,
    Priority: priority,
    Owner: prev.Owner || OWNER,
    "Last Contacted": prev["Last Contacted"] || "",
    "Next Follow-up Date": nextFollow,
    "Conversation Summary": botLog,
    "Proposal Link": prev["Proposal Link"] || "",
    "Payment Status": prev["Payment Status"] || "Not started",
    Notes: notes,
    "Lookup Key": prev["Lookup Key"] || inbound.lookup_key,
    "Channel ID": inbound.sender_id || prev["Channel ID"] || "",
    "Thread ID": inbound.thread_id || prev["Thread ID"] || "",
    Step: stepNext,
    "Automation Paused": pausedNext ? "Yes" : "No",
    "Follow-up Count": fu,
    "Last Inbound At": ist(lastInbound),
    "Last Inbound Ms": lastInbound,
    "Last Contacted Ms": prev["Last Contacted Ms"] || "",
    "Chat Window Ms": isChat || channel === "Email" ? lastInbound : prev["Chat Window Ms"] || "",
    "Last Message ID": inbound.message_id || "",
  };

  const row = send ? { ...base, "Last Contacted": ist(now), "Last Contacted Ms": now } : base;
  const rowFailed = {
    ...base,
    Status: prevStatus || "New Lead",
    Step: step,
    "Automation Paused": paused ? "Yes" : "No",
    "Follow-up Count": fu,
    "Next Follow-up Date": prev["Next Follow-up Date"] || "",
    "Conversation Summary": customerLog,
    Notes: add(notes, `Automated reply failed ${ist(now)} IST`),
  };

  let alert = null;
  if (reason) {
    const [label, next] = REASONS[reason];
    const routeText = `${text} ${req}`;
    const to = [PROJECT_SERVICES.includes(service) ? ROUTES.projects : ROUTES.general];
    if (PAYMENT.test(routeText) || !/^(|not started)$/i.test(String(row["Payment Status"]))) to.push(ROUTES.accounts);
    if (SUPPORT.test(routeText)) to.push(ROUTES.support);
    const svc = service || "Unspecified";
    const contact = row.Phone || row.Email || row["Channel ID"] || "n/a";
    alert = {
      to: [...new Set(to)].join(","),
      subject: reason === "new_lead" ? `New ${priority} ${svc} Lead - ${name || contact}` : `${label}: ${priority} ${svc} Lead - ${name || contact}`,
      body: [
        `Lead ID: ${row["Lead ID"]}`,
        `Source: ${row.Source} (${row.Channel})`,
        `Name: ${name || "n/a"}`,
        `Phone: ${row.Phone || "n/a"}`,
        `Email: ${row.Email || "n/a"}`,
        `Service Interest: ${svc}`,
        `Business Type: ${biz || "n/a"}`,
        `Requirement Summary: ${req || "n/a"}`,
        `Status: ${status}`,
        `Priority: ${priority}`,
        `Next Action: ${next}`,
        "",
        "Conversation Summary:",
        row["Conversation Summary"] || "n/a",
      ].join("\n"),
    };
  }

  return {
    skip: false,
    has_send: Boolean(send),
    row,
    row_failed: rowFailed,
    send,
    alert,
    has_alert: Boolean(alert),
    log: {
      Timestamp: ist(now),
      "Lead ID": row["Lead ID"],
      Channel: channel,
      Step: "decision",
      Result: reason || "handled",
      Detail: `status=${status}; step=${stepNext}; priority=${priority}${send ? "; reply queued" : ""}${pausedNext ? "; automation paused" : ""}`,
    },
  };
}

const now = Date.now();
const rows = $input.all().map((i) => i.json).filter((r) => r["Lead ID"]);
const out = [];
for (const { json: inbound } of $("Tag prospect replies").all().filter((i) => !i.json.outbound_reply)) {
  const prev = rows.find((r) => r["Lookup Key"] === inbound.lookup_key) || null;
  const result = decide(inbound, prev, now);
  if (!result.skip) {
    const at = prev ? rows.indexOf(prev) : -1;
    if (at >= 0) rows[at] = result.row;
    else rows.push(result.row);
  }
  out.push({ json: result });
}
return out;
