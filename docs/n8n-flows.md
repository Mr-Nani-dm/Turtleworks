# TurtleWorks — n8n Flow Catalogue

Every automation, what triggers it, what it does, and whether it is live.
Instance: `https://n8n.turtleworks.in` · timezone Asia/Kolkata · all tagged `TurtleWorks`.

**Status key:** 🟢 active · ⚪ inactive (by design / pending prerequisites)

| ID | Name | Trigger | What it does | Status |
|---|---|---|---|---|
| **TW-00** | Ops · Workflow failure alert | Any TW flow errors | Emails the team the failed workflow, step, error and a link to the execution. Set as the **error workflow** on every flow. | 🟢 |
| **TW-01** | Leads · Website enquiry intake | `POST /webhook/turtleworks-contact` (`x-contact-secret`) | Cleans the enquiry, assigns a reference (`TW-YYYYMMDD-XXXX`) + topic hint → emails the team (Reply-To = enquirer) → confirms to the website → logs the lead → hands off to TW-05. | 🟢 |
| **TW-02** | Leads · Unanswered enquiry reminder | Cron `30 9 * * 1-5` | Read-only digest of leads still `new` after ~20 h. Silent when clear. | 🟢 |
| **TW-03** | Reports · Weekly lead summary | Cron `0 9 * * 1` (Mon) | Last 7 days: submission counts, review buckets, statuses, keyword topics. | 🟢 |
| **TW-04** | Ops · Website health monitor | Hourly | Checks homepage, privacy, sitemap and the enquiry API; emails only on DOWN / RECOVERED. | 🟢 |
| **TW-05** | Leads · AI triage & draft reply | Called by TW-01 | OpenAI summarises the enquiry, picks a service line, urgency and spam risk, and writes a reply **saved to Gmail Drafts** (never sent). | 🟢 |
| **TW-06** | Reports · Monthly business report | Cron `0 9 1 * *` | Vercel analytics + submissions + proposals/invoices. *Needs a Vercel token credential.* | ⚪ |
| **TW-07** | Deals · Proposal & invoice follow-ups | Cron `15 9 * * *` | Team digest of overdue/soon-due invoices and proposals; client reminders saved as **Gmail drafts**. | 🟢 |
| **TW-08** | Leads · Inbound lead hub | Meta webhook (WhatsApp/IG/FB), Gmail (off), TW-01 | One CRM for every channel: qualification, priority, routed alerts, auto-reply on the same channel, logs to the Google Sheet. | 🟢 |
| **TW-09** | Leads · Follow-up after 24 h | Cron `5 9-20 * * *` | One polite follow-up, then "Not Now" after 3 days + a team alert. **Needs `tw_followup` template approved.** | ⚪ |
| **TW-10** | Outreach · Outbound WhatsApp campaign | Cron `0 10-17 * * 1-6` | Personalised outreach to `Outreach Ready` prospects in capped batches, follow-ups at 2 & 5 days. **Needs templates + business verification + opt-in list.** | ⚪ |
| **TW-11** | Outreach · Prospect reply handler | Called by TW-08 | Handles YES / NO / price / call; stops on NO or STOP; alerts the team. | 🟢 |
| **TW-12** | Reports · Pipeline dashboard | `GET /webhook/tw-dashboard?k=…` | Reads the live CRM sheet and renders the branded HTML dashboard server-side. Fronted at `dashboard.turtleworks.in`. | 🟢 |

---

## Channels into the system

| Channel | Enters via | Notes |
|---|---|---|
| Website form | TW-01 webhook | Live. `CONTACT_WEBHOOK_URL` in Vercel points at it. |
| WhatsApp | TW-08 (Meta webhook `messages`) | Live. Number +91 79898 89116. |
| Instagram / Facebook | TW-08 | Wired; activates when a Page token is added. |
| Email (Gmail) | TW-08 | Ships **disabled** — enable the Gmail trigger when ready. |

## Storage

- **Live CRM** — Google Sheet `TurtleWorks-CRM` (tabs: `Leads`, `Log`, `Prospects`, `Outreach Log`). Must stay a **native Google Sheet** (not .xlsx).
- **Legacy Data Tables** — n8n `Leads` (`IKZBrzsILfRlvhuq`) + `Deals` (`azWzn26M4TjWTDOh`), used by the reporting flows (TW-02/03/06).

## Credentials in use (IDs, not secrets)

| Credential | Type | ID | Used by |
|---|---|---|---|
| Gmail account | gmailOAuth2 | `vgfMf0CIW2WHryis` | TW-01/05/07/08 + alerts |
| Google Sheets account | googleSheetsOAuth2Api | `6W94tPVAaMA9fCz8` | TW-08/09/10/11/12 |
| TW · OpenAI API | openAiApi | `lMWwBSCcQeGmVg6f` | TW-05 |
| TW · WhatsApp Cloud API token | httpHeaderAuth | `DuEW3E5yCdoGHkZW` | TW-08/09/10/11 |
| TW x-contact-secret | httpHeaderAuth | `3Xb5nDPY6jhdVxsL` | TW-01 webhook auth |

> ⚠️ The WhatsApp token is a **60-day** token (expires ~2026-12-11). Regenerate a
> "Never"-expiry System User token in Meta and update credential `DuEW3E5yCdoGHkZW`.

## Templates (WhatsApp, pending Meta approval)

| Template | Used by | Variables |
|---|---|---|
| `tw_followup` | TW-09 | `{{1}}` first name |
| `tw_outreach_initial` | TW-10 | name, observation, business |
| `tw_outreach_fu1` | TW-10 | name, business |
| `tw_outreach_fu2` | TW-10 | name |

See [architecture.md](architecture.md) for how these fit together, and
[operations-runbook.md](operations-runbook.md) for monitoring and fixes.
