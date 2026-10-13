# TurtleWorks — Documentation

Professional reference for how TurtleWorks is built and run.

| Doc | What it covers |
|---|---|
| [architecture.md](architecture.md) | The components, where each lives, and data-flow diagrams (website enquiry, WhatsApp hub, dashboard & reports). |
| [n8n-flows.md](n8n-flows.md) | Catalogue of all 13 automations (TW-00…TW-12): trigger, purpose, live status, credentials, templates. |
| [operations-runbook.md](operations-runbook.md) | Where to look when something breaks and how to fix the common cases. Start here in an incident. |
| [crm-framework.md](crm-framework.md) | How leads/prospects are stored, identified and de‑duplicated (IDs, statuses, YES/NO suppression rules). |

**Quick facts:** website on Vercel (`turtleworks.in`) · automations on a self-hosted
n8n/OVH VPS (`n8n.turtleworks.in`) · CRM in a Google Sheet · live dashboard at
`dashboard.turtleworks.in`.

Diagrams use [Mermaid](https://mermaid.js.org/) and render on GitHub and in most
Markdown viewers. Secrets are never stored here — see the runbook.
