# Self-hosting n8n on a VPS (OVH, Hetzner, etc.)

Runs n8n 24/7 with **Postgres** (persistent data), **Caddy** (automatic HTTPS),
and a **fixed encryption key from first boot** so credentials never break on
restart. `setup.sh` is self-contained — it writes the compose file, the
Caddyfile and a secrets `.env`, then starts everything.

## What you do (only you can)

1. **Order the VPS** — OVH US-West (Hillsboro), Ubuntu. A 2 GB RAM plan is the
   comfortable minimum for n8n; 1 GB works but is tight.
2. **DNS** — add an **A record** `n8n.turtleworks.in` → the VPS public IP
   (wherever turtleworks.in's DNS is managed). HTTPS won't issue until this
   resolves to the server.
3. **SSH in** as root (OVH emails the IP + root password), then run:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/integrations/n8n/vps/setup.sh -o setup.sh
   # or copy the file up with scp
   N8N_HOST=n8n.turtleworks.in bash setup.sh
   ```

4. Open **https://n8n.turtleworks.in** and create your owner account.

## What Claude does after

- Re-import all 12 workflows via the n8n API (new API key from this instance).
- Re-apply the wiring (inbox, error-workflow links, AI/lead-hub links, webhook secret).
- Point the website's `CONTACT_WEBHOOK_URL` at `https://n8n.turtleworks.in/webhook/turtleworks-contact`.

## Credentials must be redone here (OAuth can't migrate)

- **Gmail / Google Sheets**: new Google OAuth client with redirect URI
  `https://n8n.turtleworks.in/rest/oauth2-credential/callback`.
- **OpenAI**: paste the key.

## Keep safe / back up

- `/opt/turtleworks-n8n/.env` — holds `N8N_ENCRYPTION_KEY` and the DB password.
  Losing the encryption key makes stored credentials unreadable. Copy it somewhere safe.
- Postgres data lives in the `postgres_data` Docker volume.

## Day-2 operations

```bash
cd /opt/turtleworks-n8n
docker compose logs -f n8n      # watch logs
docker compose pull && docker compose up -d   # update n8n
docker compose down             # stop
```
