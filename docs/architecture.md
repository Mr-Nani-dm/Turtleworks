# TurtleWorks — System Architecture

How the TurtleWorks website and automation suite fit together: the components,
where each lives, and how a lead travels through the system.

- **Website:** Next.js 16 + Tailwind v4, deployed on **Vercel** → `turtleworks.in`
- **Automation hub:** self-hosted **n8n** on an **OVH VPS** → `n8n.turtleworks.in`
- **CRM store:** Google Sheet **TurtleWorks-CRM** (+ legacy n8n Data Tables)
- **Dashboard:** n8n-rendered → `dashboard.turtleworks.in`

---

## 1. Components

| Layer | Component | Where it runs | Purpose |
|---|---|---|---|
| Front door | **Website** (Next.js 16, Tailwind v4) | Vercel (`turtleworks.in`) | Marketing site + enquiry form |
| Intake | **Contact webhook** | `POST n8n.turtleworks.in/webhook/turtleworks-contact` (header `x-contact-secret`) | Receives website enquiries |
| Orchestration | **n8n** (13 workflows) | OVH VPS, Docker | Runs every automation 24/7 |
| Database | **Postgres 16** | OVH VPS, Docker volume | n8n's own data (executions, workflows) |
| TLS / proxy | **Caddy 2** | OVH VPS, Docker | Auto-HTTPS + reverse proxy for both subdomains |
| CRM store | **Google Sheet "TurtleWorks-CRM"** | narendra@turtleworks.in Drive | Leads / Log / Prospects / Outreach Log |
| Legacy store | **n8n Data Tables** | n8n | Website leads (`Leads`), deals (`Deals`) — used by reports |
| Messaging | **WhatsApp Cloud API** | Meta | Inbound + outbound WhatsApp (number +91 79898 89116) |
| AI | **OpenAI API** | OpenAI | TW-05 triage + draft replies |
| Email | **Gmail (OAuth2)** | Google | Team alerts + saved drafts (never auto-sends) |
| Dashboard | **TW-12 renderer** | n8n → `dashboard.turtleworks.in` (Caddy Basic Auth) | Live pipeline view |

### Infrastructure (OVH VPS `15.204.90.176`)

```mermaid
flowchart TB
  subgraph VPS["OVH VPS · Ubuntu · Docker Compose · /opt/turtleworks-n8n"]
    Caddy["Caddy 2<br/>auto-HTTPS + proxy"]
    N8N["n8n<br/>(13 workflows)"]
    PG[("Postgres 16<br/>postgres_data volume")]
    Caddy --> N8N
    N8N --> PG
  end
  DNS1["n8n.turtleworks.in"] --> Caddy
  DNS2["dashboard.turtleworks.in<br/>(Basic Auth)"] --> Caddy
  ENV[".env<br/>N8N_ENCRYPTION_KEY + DB pw<br/>(back this up!)"] -.-> N8N
```

> The **encryption key** in `/opt/turtleworks-n8n/.env` is fixed from first boot.
> Losing it makes every stored credential unreadable. Back that file up.

---

## 2. Data flow — website enquiry

```mermaid
flowchart LR
  V["Visitor"] -->|submits form| SITE["turtleworks.in<br/>(Vercel)"]
  SITE -->|POST + x-contact-secret| T01["TW-01<br/>Enquiry intake"]
  T01 --> MAIL["Email team<br/>(Reply-To = enquirer)"]
  T01 --> OK["Confirm to website"]
  T01 --> LOG["Log to n8n Data Table"]
  T01 --> T05["TW-05<br/>AI triage (OpenAI)"]
  T05 --> DRAFT["Gmail draft reply<br/>(never sent)"]
```

The website waits up to 8 s for TW-01, so the team email + site confirmation
return first; logging and AI triage finish after the response.

---

## 3. Data flow — WhatsApp / inbound lead hub

```mermaid
flowchart LR
  C["Customer"] -->|WhatsApp/IG/FB| META["Meta Cloud API"]
  META -->|webhook /meta-inbound| T08["TW-08<br/>Inbound lead hub"]
  T08 --> CRM[("Google Sheet<br/>TurtleWorks-CRM")]
  T08 --> REPLY["Auto-reply on same channel"]
  T08 --> ALERT["Email alert to team"]
  T08 -->|prospect reply| T11["TW-11<br/>Reply handler (YES/NO/price/call)"]
  T09["TW-09<br/>24h follow-up (cron)"] --> CRM
  T10["TW-10<br/>Outreach (cron)"] -->|templates| META
  T11 --> CRM
```

Dedup rules live inside the flows: every lead gets a unique ID
(`WA-YYYYMMDD-XXXX`); **YES** keeps a prospect active, **NO** sets
`Do Not Contact` so they are never re-contacted.

---

## 4. Data flow — dashboard & reports

```mermaid
flowchart LR
  CRM[("Google Sheet<br/>TurtleWorks-CRM")] --> T12["TW-12<br/>Dashboard renderer"]
  T12 -->|Caddy Basic Auth| DASH["dashboard.turtleworks.in"]
  DT[("n8n Data Tables")] --> RPT["TW-02 / TW-03 / TW-06<br/>reminder + summaries (cron)"]
  RPT --> TEAM["Team email digests"]
  T07["TW-07<br/>Deal follow-ups (cron)"] --> DRAFTS["Gmail drafts"]
```

The dashboard renders **server-side on each load** — always current, with an
"Updated … IST" stamp at the top.

---

## 5. Key identifiers (non-secret)

| Thing | Value |
|---|---|
| VPS IP | `15.204.90.176` (OVH, Oregon) |
| n8n | `https://n8n.turtleworks.in` |
| Dashboard | `https://dashboard.turtleworks.in` (Basic Auth) |
| CRM Sheet ID | `1OGKDalTvCRJDad3iMnRhYLQWJA8zNDZXiGiI5Vi8ipo` |
| WhatsApp number | +91 79898 89116 · Phone Number ID `1283289098210230` |
| WABA ID | `1460213609344245` |
| Meta app | TurtleWorks n8n (`1432326073288423`) |
| Meta webhook | `…/webhook/meta-inbound` (field: `messages`) |

**Secrets** (encryption key, DB password, API tokens, dashboard password) live
only on the VPS `.env`, in n8n credentials, and the team password manager —
**never in this repo**. See [operations-runbook.md](operations-runbook.md).

For the per-flow catalogue see [n8n-flows.md](n8n-flows.md).
