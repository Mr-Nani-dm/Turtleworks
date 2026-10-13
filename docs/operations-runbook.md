# TurtleWorks — Operations Runbook

What to check when something looks wrong, and how to fix the common cases.
Pair this with [architecture.md](architecture.md) and [n8n-flows.md](n8n-flows.md).

---

## 1. Where to look first (in order)

| # | Place | What it tells you |
|---|---|---|
| 1 | **Team inbox** | TW-00 emails every failure (which flow, which step, the error, a link to the execution). This is your first alert. |
| 2 | **n8n → Executions** (`n8n.turtleworks.in`) | Filter by workflow; red = error. Open one to see exactly which node failed and the message. |
| 3 | **Dashboard** (`dashboard.turtleworks.in`) | If leads stop appearing or counts look wrong, the pipeline may be stuck. |
| 4 | **VPS logs** (SSH, below) | For n8n/Caddy/Postgres-level problems (site down, TLS, container crash). |
| 5 | **Meta → WhatsApp Manager** | Delivery/quality issues, template status, number status. |

### Getting onto the server

```bash
ssh ubuntu@15.204.90.176          # ed25519 key; passwordless sudo
cd /opt/turtleworks-n8n
sudo docker compose ps            # are all 3 containers up?
sudo docker compose logs -f n8n   # live n8n logs
sudo docker compose logs -f caddy # TLS / proxy logs
```

---

## 2. Common problems and fixes

### A flow keeps failing
1. Open the red execution in **n8n → Executions**; read the failing node's error.
2. Match it to a case below. If it's a transient network blip, **re-run** the execution.
3. After fixing, confirm a clean run.

### Google Sheets node fails
- **"has not been used in project 229522702832 … or it is disabled"** → the Google **Sheets API** is off. Enable it: <https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=229522702832>, wait ~2 min, re-run.
- **"The document must not be an Office file"** → the CRM file is an uploaded `.xlsx`, not a native Sheet. Open it → **File → Save as Google Sheets**, then update the sheet ID in TW-08/09/10/11/12.
- **403 / Forbidden** → the Google Sheets credential lost access or the sheet's sharing changed. Re-authorise credential `6W94tPVAaMA9fCz8`, confirm the sheet is shared to the connected account.

### WhatsApp messages not sending
- **401 / token error** → the WhatsApp token expired (it's a **60-day** token, ~2026-12-11). In Meta → Business Settings → System Users → `n8n-system` → **Generate new token** (expiry **Never**, scopes `whatsapp_business_messaging` + `whatsapp_business_management`), then update n8n credential `DuEW3E5yCdoGHkZW`.
- **"template not found" / #132xxx** → the template isn't approved yet, or the language code differs (must be `en`). Check **WhatsApp Manager → Message Templates**.
- **Business-initiated message rejected** → outside the 24 h window you must use an **approved template**; free-form only works within 24 h of the customer's last message.

### WhatsApp messages not being received
- Only verification pings arrive → the **`messages`** webhook field isn't subscribed. App → WhatsApp → **Configuration → Webhook fields → Manage → subscribe `messages`**.
- Nothing at all → confirm the callback URL `…/webhook/meta-inbound` is **Verified** and the WABA shows the app under **subscribed_apps**, and that **TW-08 is active**.

### Website enquiries not arriving
- Check Vercel env `CONTACT_WEBHOOK_URL` = `https://n8n.turtleworks.in/webhook/turtleworks-contact` and `CONTACT_WEBHOOK_SECRET` matches the n8n `x-contact-secret` credential.
- Confirm **TW-01 is active**. Test:
  ```bash
  curl -s -X POST https://n8n.turtleworks.in/webhook/turtleworks-contact \
    -H "x-contact-secret: <secret>" -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"t@e.com","message":"hi"}'
  # expect {"ok":true}
  ```

### Dashboard won't load
- **401** → that's Basic Auth working; enter the dashboard username/password.
- **502 / can't reach** → n8n or Caddy is down (`sudo docker compose ps`), or **TW-12 is inactive**.
- **"Access denied" page** → the token in the Caddy rewrite no longer matches TW-12's token. Check the `rewrite … ?k=` line in `/opt/turtleworks-n8n/Caddyfile`.
- Edited the Caddyfile? Reload without downtime:
  ```bash
  sudo docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  ```

### n8n is down / won't start
```bash
cd /opt/turtleworks-n8n
sudo docker compose ps
sudo docker compose restart n8n        # or: up -d
sudo docker compose logs --tail=100 n8n
```

### "signing.hmac cannot be read" / all credentials broken
The `N8N_ENCRYPTION_KEY` changed or was lost. **Restore the original** `/opt/turtleworks-n8n/.env` from backup — do **not** generate a new key, or every stored credential becomes unreadable.

### TLS certificate problem
Caddy issues/renews automatically once DNS resolves. If a cert fails, confirm the A record points at `15.204.90.176` and check `sudo docker compose logs caddy`.

---

## 3. Routine maintenance

```bash
# Update n8n to the latest image
cd /opt/turtleworks-n8n && sudo docker compose pull && sudo docker compose up -d
```

- **Back up** `/opt/turtleworks-n8n/.env` (encryption key + DB password) somewhere safe. Without the key, stored credentials cannot be recovered.
- Postgres data lives in the `postgres_data` Docker volume.
- **TW-04** is the biggest execution consumer (hourly health checks); moving uptime to a free external monitor would cut ~720 runs/month.

---

## 4. Ownership & escalation

| Area | Where it's managed |
|---|---|
| Website / deploy | Vercel project (`turtleworks`) |
| Automations | n8n on the OVH VPS |
| WhatsApp / Meta | Meta Business "TurtleWorks", app "TurtleWorks n8n" |
| CRM data | Google Sheet `TurtleWorks-CRM` (narendra@turtleworks.in) |
| Secrets | VPS `.env`, n8n credentials, team password manager — never the repo |

When a fix touches credentials or the Caddyfile, note it in the company
change log so the next person isn't surprised.
