#!/usr/bin/env bash
#
# TurtleWorks — one-shot n8n setup for an Ubuntu VPS (OVH, Hetzner, etc.).
# Installs Docker, then runs n8n + Postgres + Caddy (automatic HTTPS) 24/7.
#
# The encryption key and DB password are generated ONCE and saved to
# /opt/turtleworks-n8n/.env, so they stay stable across restarts and
# redeploys. (This is what broke the earlier Railway attempt: setting the
# key after first boot. Here it is fixed from the very first start.)
#
# Run as root (or with sudo):
#   N8N_HOST=n8n.turtleworks.in bash setup.sh
#
# Prerequisite: a DNS A record for N8N_HOST pointing at this server's public IP.
set -euo pipefail

DOMAIN="${N8N_HOST:-}"
if [ -z "$DOMAIN" ]; then
  read -rp "Domain for n8n (e.g. n8n.turtleworks.in): " DOMAIN
fi
TZ_REGION="${GENERIC_TIMEZONE:-Asia/Kolkata}"
APP_DIR="/opt/turtleworks-n8n"

echo "==> [1/5] Installing Docker (if missing)..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl openssl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "==> [2/5] Opening firewall for SSH + web..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp  >/dev/null 2>&1 || true
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  yes | ufw enable  >/dev/null 2>&1 || true
fi

echo "==> [3/5] Writing stack to $APP_DIR..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

cat > docker-compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: ${POSTGRES_DB}
      DB_POSTGRESDB_USER: ${POSTGRES_USER}
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_HOST: ${N8N_HOST}
      N8N_PROTOCOL: https
      N8N_PORT: 5678
      WEBHOOK_URL: https://${N8N_HOST}/
      N8N_EDITOR_BASE_URL: https://${N8N_HOST}/
      GENERIC_TIMEZONE: ${GENERIC_TIMEZONE}
      TZ: ${GENERIC_TIMEZONE}
      N8N_PROXY_HOPS: "1"
      N8N_SECURE_COOKIE: "true"
      N8N_RUNNERS_ENABLED: "true"
    volumes:
      - n8n_data:/home/node/.n8n
    expose:
      - "5678"

  caddy:
    image: caddy:2
    restart: unless-stopped
    depends_on:
      - n8n
    ports:
      - "80:80"
      - "443:443"
    environment:
      N8N_HOST: ${N8N_HOST}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  n8n_data:
  caddy_data:
  caddy_config:
YAML

cat > Caddyfile <<'CADDY'
{$N8N_HOST} {
	reverse_proxy n8n:5678
}
CADDY

echo "==> [4/5] Generating secrets (.env) if absent..."
if [ ! -f .env ]; then
  cat > .env <<EOF
N8N_HOST=$DOMAIN
GENERIC_TIMEZONE=$TZ_REGION
POSTGRES_USER=n8n
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=n8n
N8N_ENCRYPTION_KEY=$(openssl rand -hex 24)
EOF
  chmod 600 .env
  echo "    Fresh secrets written to $APP_DIR/.env — BACK THIS FILE UP."
else
  echo "    .env already exists — keeping existing secrets."
fi

echo "==> [5/5] Starting the stack..."
docker compose pull
docker compose up -d

echo ""
echo "============================================================"
echo " n8n is starting. Once DNS for $DOMAIN points at this server,"
echo " Caddy will fetch an HTTPS certificate automatically."
echo " Open:  https://$DOMAIN   (create the owner account there)"
echo " Webhook base: https://$DOMAIN/webhook/..."
echo " Data/secrets live in: $APP_DIR/.env  (back it up)"
echo "============================================================"
