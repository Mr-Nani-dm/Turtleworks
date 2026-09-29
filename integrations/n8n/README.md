# TurtleWorks — n8n automations

Instance: https://turtleworks.app.n8n.cloud · timezone Asia/Kolkata · all flows tagged `TurtleWorks`.

| Flow | Trigger | What it does | Runs / month |
|---|---|---|---|
| **TW-00 · Ops · Workflow failure alert (error handler)** | Any TW flow errors | Emails the team the workflow, failed step, error and execution link | only on failure |
| **TW-01 · Leads · Website enquiry intake — notify, log, acknowledge** | `POST /webhook/turtleworks-contact` (header `x-contact-secret`) | Cleans the enquiry, assigns a reference (`TW-YYYYMMDD-XXXX`) and a topic hint → emails the team (Reply-To = enquirer) → confirms to the website → logs the lead → optional auto-reply to the enquirer (disabled by default) | 1 per enquiry |
| **TW-02 · Leads · Unanswered enquiry reminder (weekdays 09:30 IST)** | Cron `30 9 * * 1-5` | Emails a list of leads still `new` after 20 h; silent when clear | ~22 |
| **TW-03 · Reports · Weekly lead summary (Mondays 09:00 IST)** | Cron `0 9 * * 1` | Last 7 days: count, by topic, by status, still awaiting reply | ~4 |
| **TW-04 · Ops · Website health monitor (hourly)** | Every hour | Checks homepage, privacy, sitemap and the enquiry API; emails only on DOWN / RECOVERED (reminder every 6 h while down) | ~720 |
| **TW-05 · Leads · AI triage & draft reply (OpenAI)** | Called by TW-01 (hand-off node) | OpenAI (`gpt-5.4-mini-2026-03-17`) summarises the enquiry, picks a service line, urgency and spam risk, and writes a reply saved to **Gmail → Drafts** (never sent); triage saved to the lead and emailed to the team | 1 per enquiry |
| **TW-06 · Reports · Monthly website & business report (1st, 09:00 IST)** | Cron `0 9 1 * *` | Vercel Web Analytics (visitors, page views, top pages, referrers, countries) + enquiries + proposals/invoices for last month | 1 |
| **TW-07 · Deals · Proposal & invoice follow-ups (daily 09:15 IST)** | Cron `15 9 * * *` | Team digest of overdue / soon-due invoices and proposals due a follow-up; client reminders saved as **Gmail drafts** (never sent) | ~30 |

Lead log: n8n → **Data tables → "TW Leads — website enquiries"**. Status convention: `new` → `replied` → `qualified` → `won` / `lost`. Set `replied` after answering so TW-02 stops reminding.

Deals: n8n → **Data tables → "TW Deals — proposals & invoices"** — add one row per proposal/engagement.

| Column | Use |
|---|---|
| `deal_id`, `lead_id` | your reference, and the website lead it came from (optional) |
| `client_name`, `client_email`, `title` | who and what; drafts go to `client_email` |
| `value_inr` | proposal value |
| `proposal_status` | `draft` → `sent` → `accepted` / `declined` |
| `proposal_sent_on`, `proposal_follow_up_on` | follow-up draft is created on this date, then weekly while still `sent` |
| `invoice_number`, `invoice_amount_inr`, `invoice_issued_on`, `invoice_due_on` | invoice details |
| `invoice_status` | `unpaid` → `paid` (or `void`); reminder draft 1 day after due, then weekly |

### Credentials to add (in n8n → Credentials)

- **TW-05:** *OpenAI* — API key from platform.openai.com with prepaid credit and a monthly budget limit. Keep `ENQUIRY_AI_PROCESSOR=OpenAI API` in Vercel so `/privacy` discloses it.
- **TW-06:** *Header Auth* — Name `Authorization`, Value `Bearer <Vercel token>`; the token needs access to the team that owns the `turtleworks` project. Web Analytics must be enabled in Vercel and `NEXT_PUBLIC_ENABLE_ANALYTICS=1`.

## Importing into another instance

The JSON files use placeholders — replace them after import (or before, with find/replace):

| Placeholder | Value |
|---|---|
| `__TEAM_INBOX__` | inbox that receives notifications |
| `__GMAIL_CREDENTIAL_ID__` | Gmail OAuth2 credential |
| `__WEBHOOK_SECRET_CREDENTIAL_ID__` | Header Auth credential, name `x-contact-secret`, value = Vercel `CONTACT_WEBHOOK_SECRET` |
| `__LEADS_TABLE_ID__` | data table created from `tw-leads-table.json` |
| `__DEALS_TABLE_ID__` | data table created from `tw-deals-table.json` |
| `__ERROR_WORKFLOW_ID__` | id of TW-00 |
| `__AI_TRIAGE_WORKFLOW_ID__` | id of TW-05 |
| `__OPENAI_CREDENTIAL_ID__`, `__VERCEL_TOKEN_CREDENTIAL_ID__` | credentials above |

## Notes

- The website waits up to 8 s for TW-01, so the team email and the website confirmation come first; logging and the auto-reply run after the response.
- AI output is validated (allowed values only, lengths capped) and never sent to anyone automatically; the enquiry is passed as untrusted content.
- `topic_hint` (TW-01) and `service_fit` (TW-05) use the six services in `src/data/services.ts` (short labels: Website, Get found, WhatsApp & automation, Custom app, Dashboards, Plan); update both flows when that catalogue changes. `topic_hint` is a keyword guess — a triage aid, not a classification.
- Content-engine categories, tags and pillar topics live in `integrations/content/content-taxonomy.json`.
- TW-04 is the largest consumer of executions. Moving uptime checks to a free external monitor saves ~720 runs/month.
- `turtleworks-contact-workflow.json` is the original single-step version, superseded by TW-01.
