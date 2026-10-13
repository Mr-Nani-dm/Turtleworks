# TurtleWorks — CRM Framework & Conventions

How leads and prospects are stored, identified, and de‑duplicated. These rules
are **already enforced by the n8n flows** (TW‑08/09/10/11); this doc is the
single reference so everyone treats the data the same way.

Validated against the live sheet headers on **2026‑10‑13**.

---

## 1. One live sheet

- **TurtleWorks‑CRM** — a **native Google Sheet** (ID `1OGKDalTvCRJDad3iMnRhYLQWJA8zNDZXiGiI5Vi8ipo`), owned by narendra@turtleworks.in.
- It must stay a native Sheet (an uploaded `.xlsx` breaks the API).
- A pointer lives in Drive → `02_Business/Leads & Sales`. The "PLANNING — …" sheets there are **not** the live CRM.
- **Never** put passwords, tokens or API keys in the sheet.

## 2. Two populations, four tabs

| Tab | Who | Written by |
|---|---|---|
| **Leads** | People who contacted *us* (inbound) | TW‑01 (website), TW‑08 (WhatsApp/IG/FB/email) |
| **Prospects** | People *we* reach out to (outbound) | TW‑10 (outreach), maintained manually when sourcing |
| **Log** | Every inbound decision/reply event | TW‑08/09/11 |
| **Outreach Log** | Every outbound send/step event | TW‑10 |

## 3. Unique IDs (every row) + email

- **Leads:** `<CH>-YYYYMMDD-XXXX` where `CH` = channel (`WA`, `IG`, `FB`, `EM`) or `TW` for website. Example `WA-20261012-RI6DSD`.
- **Prospects:** `PR-####`.
- **Email** is captured when known. WhatsApp leads are often phone‑only — that's fine; the ID is the key, email is secondary.
- **De‑dup key:** the `Lookup Key` column (`phone:<number>` or `email:<addr>`). One person → one row; a repeat message updates the same row instead of creating a duplicate.

## 4. Channels in

| Channel | Status | How |
|---|---|---|
| WhatsApp | 🟢 live | TW‑08 via Meta webhook |
| Website form | 🟢 live | TW‑01 |
| Instagram / Facebook | 🟡 wired | TW‑08 (activate with a Page token) |
| Email | ⚪ off by design | TW‑08 Gmail trigger (enable when ready) |
| YouTube / other | ✍️ manual | No inbound API — add the row by hand with a `TW-` id |

## 5. Status conventions

**Leads** (inbound):
`New` → `Auto Reply Sent` → `Questionnaire Started` → `Replied` / `Qualified` → `Call Requested` → `Won` / `Lost`.
Priority: **Cold / Warm / Hot** (set by the flow as the conversation qualifies).
`Automation Paused = Yes` means a human has taken over (e.g. a call was requested) — the bot stops auto‑replying.

**Prospects** (outbound):
`Outreach Ready` → `Outreach Sent` → `Follow-up 1 Sent` → `Follow-up 2 Sent` → `Interested` / `Not Interested` / `No Response`.
`Reply Status`: **Awaiting / YES / NO**.

## 6. De‑dup & suppression rules (the core policy)

This is exactly the "yes → keep, no → remove, never double‑contact" behaviour:

- **One row per person** — enforced by `Lookup Key`. Re‑contacts update, never duplicate.
- **YES** → prospect stays active, `Reply Status = YES`, status → `Interested`; handed to the team to close. Not spammed further by the bot.
- **NO / STOP** → `Do Not Contact = Yes`. TW‑10 and TW‑09 **skip** anyone with `Do Not Contact = Yes` or `Reply Status = NO`, so they are **never re‑contacted**.
- **No reply** → after 2 follow‑ups and 7 days, status → `No Response`; no further outreach.
- **Compliance** — TW‑10 only messages prospects with a valid **`Contact Basis`** (opt‑in / prior relationship). Cold, un‑consented outreach is a ban risk and is not sent.

## 7. What's NOT needed

The live sheet already has every column these rules require (`Lookup Key`,
`Email`, `Status`, `Priority`, `Reply Status`, `Do Not Contact`, `Contact Basis`,
follow‑up/timestamp fields). **No structural change is needed** — keep the headers
as they are so the flows keep matching them. If you add a column, add it to the
right of existing ones and update the relevant flow.

See [n8n-flows.md](n8n-flows.md) for which flow writes what, and
[operations-runbook.md](operations-runbook.md) for fixes.
