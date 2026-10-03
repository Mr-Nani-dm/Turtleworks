# TurtleWorks lead hub (TW-08 and TW-09)

One CRM for every inbound lead. A message from the website, WhatsApp, Instagram, Facebook or Gmail is captured, answered on the same channel, qualified with five questions, saved to Google Sheets, and routed to the right inbox. Sales messages stop the moment a human is needed.

```
Website form (TW-01) ─┐
Meta webhook (WhatsApp, Instagram, Facebook) ─┼─> Normalise ─> Read CRM ─> Lead engine ─> reply on same channel ─> Save to CRM ─> Team alert
Gmail (shipped OFF) ──┘                                                        └─> Log

TW-09 (hourly 09:05-20:05 IST): 24 h no answer -> one follow-up · 72 h -> Not Now + team alert
```

## Files

| File | Purpose |
|---|---|
| `normalise.js` | One shape for every source; drops status callbacks, echoes, reactions, our own mail, noreply and auto-replies |
| `engine.js` | The rules: questionnaire, priority, routing, human hold, opt-out, duplicates |
| `followup.js` | 24 h nudge and 72 h close-out |
| `test-hub.mjs` | 70 checks. Run `node test-hub.mjs` after any rule change |
| `build-hub.mjs` | Regenerates `../tw-08-*.json`, `../tw-09-*.json` and the sheet header CSVs |

## Rules (as built)

- **Questionnaire**, one question at a time: menu (1-5) then business type, existing website or system, main issue, how soon, quick call?
- **Priority** never goes down. Hot: asks for a call, price, quote, proposal, or urgent timing, or says yes to the call question. Warm: gave business details. Cold: otherwise.
  A plain "yes" to "do you have a website?" does not count as Hot; only "yes" to the call question does.
- **Human hold**: `Call Requested`, `Proposal Drafted`, `Payment Pending`, `Needs Human Review` set `Automation Paused = Yes`. While paused (or after `Qualified`, `Proposal Sent`, `Won`...), the bot sends nothing and the team is alerted on every customer reply. Set `Automation Paused = No` in the sheet to resume.
- **Never automatic**: proposals and payment links. The engine has no code path that sends either.
- **Routing**: `projects@` for website, automation and dashboard leads; `hello@` otherwise; `accounts@` added for payment, invoice, billing, GST or receipt mentions; `support@` added for existing-client or site-down wording.
- **Opt-out**: "stop", "unsubscribe" or "opt out" marks `Not Now`, pauses, sends one confirmation, and never messages again.
- **Duplicates**: Meta retries webhooks; a repeated message id is ignored.
- **Failed send**: the lead is not advanced, the failure is logged, and `hello@` is emailed, so the customer can be answered by hand.
- **Follow-up**: at most one. It goes out 22 h after the last message when the chat window is still open (free text), otherwise 24 h later with an approved template. Never before 09:00 or after 21:00 IST.
- **Estimated Value** is left blank for a human to fill (used by the revenue pipeline in Looker Studio). It is never guessed.

## Setup

**1. CRM sheet.** Create a Google Sheet with two tabs, `Leads` and `Log`. Paste `../crm-leads-sheet-columns.csv` and `../crm-log-sheet-columns.csv` as row 1. Set the sheet locale to India and time zone to Asia/Kolkata. Do not reorder or rename columns: `Lead ID` is the unique key, `Lookup Key` finds a person across channels.

**2. n8n credentials.** Google Sheets OAuth2 (sign in as the CRM owner). Two Header Auth credentials named `Authorization` with value `Bearer <token>`: one for the WhatsApp Cloud API system-user token, one for the Facebook Page token used for Instagram and Messenger.

**3. Placeholders** (replace after import, see `../README.md`):

| Placeholder | Value |
|---|---|
| `__CRM_SHEET_ID__` | the id in the sheet URL |
| `__GSHEETS_CREDENTIAL_ID__` | Google Sheets credential |
| `__WA_TOKEN_CREDENTIAL_ID__`, `__META_PAGE_TOKEN_CREDENTIAL_ID__` | the two Header Auth credentials |
| `__WA_PHONE_NUMBER_ID__` | WhatsApp phone number id (Meta app > WhatsApp > API setup) |
| `__META_WEBHOOK_PATH__` | a long random string you choose; the webhook URL is `https://<n8n>/webhook/<that string>` |
| `__META_VERIFY_TOKEN__` | another random string you choose; paste the same value into the Meta webhook settings |
| `__LEAD_HUB_WORKFLOW_ID__` | id of TW-08 (used by TW-01) |

**4. Meta.** One Meta app with WhatsApp, and Messenger and Instagram if wanted. Point each product's webhook at the same URL and verify token, and subscribe to `messages`. Create two WhatsApp templates (language English):

- `tw_welcome` (category Marketing): the menu text with `{{1}}` as the first name. Used when a website visitor gives a phone number.
- `tw_followup` (category Utility or Marketing): "Hi {{1}}, just checking in. Happy to continue whenever suits you. Just reply here and we'll pick up where we left off."

**5. Confirm the mailboxes exist**: `projects@`, `accounts@`, `support@turtleworks.in`. If one does not, alerts to it bounce.

**6. Turn on**, in this order: TW-08 and TW-09 (publish), test with your own WhatsApp number and a second email address, then enable the `Gmail · new enquiry email` node. It ships OFF so the bot cannot auto-reply to cold sales email.

**7. Website phone field** (not built yet, by design): add an optional "WhatsApp number" field to the contact form with a consent line, and update `/privacy`. Do this only after `tw_welcome` is approved, or every website lead with a phone number will raise a "reply failed" alert.

## Limits and honest caveats

- **Do not register your personal WhatsApp (the number on the website button) on the Cloud API.** It would stop working in the normal WhatsApp app. Use a separate number, or WhatsApp Business app coexistence.
- **Meta rules.** Free-form messages only inside 24 h of the customer's last message; outside it, only approved templates (paid per message; check Meta's current India rate card). Instagram and Messenger need Meta app review before real customers can use them.
- **Webhook authenticity.** The Meta POST webhook is protected only by its secret path. Adding `X-Hub-Signature-256` verification (needs the raw body and the Meta app secret) is the next hardening step.
- **Gmail lead detection is heuristic.** It skips noreply, our own domain, `[TW-` notifications and auto-replies, but it cannot tell a cold sales pitch from a real enquiry. Reuse the spam check in TW-05 if this proves noisy.
- **Two ledgers for now.** TW-01 still writes website leads to the n8n data table used by TW-02, TW-03 and TW-07. The Sheet is the CRM for everything the hub handles. Migrate those three reports to the Sheet when convenient.
- **Team email duplication.** For website leads, TW-01's "New enquiry" email and the hub's routed alert both go out. Remove TW-01's once the hub is proven.
- **Service labels** follow your menu (Website design, Business automation, Dashboard / FinOps, SEO / content, Not sure). Custom software and cloud-cost work map to Business automation and Dashboard / FinOps.
- **Execution budget.** TW-09 runs about 360 times a month, on top of TW-04's 720 and one run per inbound message.
