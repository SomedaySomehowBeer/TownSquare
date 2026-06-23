#!/usr/bin/env bash
# One-time setup for a FRESH Ubuntu droplet to host the Someday Somehow TownSquare.
# Run as root (or with sudo) on the wiped droplet.
set -euo pipefail

# 1. Docker + compose plugin
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

# 2. Firewall: SSH + HTTP(S) only
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw --force enable || true
fi

# 3. App directory holds the compose file + Caddyfile (copy them here).
install -d /opt/townsquare/ops

cat <<'NOTE'
Next:
  1. Copy docker-compose.yml to /opt/townsquare/ and ops/Caddyfile to /opt/townsquare/ops/
  2. Point DNS: townsquare.somedaysomehow.beer  A  <this droplet IP>
  3. Authenticate to GHCR so compose can pull the private image:
       echo <GHCR_PAT> | docker login ghcr.io -u <github-user> --password-stdin
     (or make the GHCR package public and skip this)
  4. cd /opt/townsquare && docker compose up -d
  5. Verify: curl -fsS https://townsquare.somedaysomehow.beer/healthz
NOTE
