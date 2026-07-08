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

# 3. App directory holds the compose file (copy it here). TLS/routing is owned
#    by the shared edge Caddy in the droplet-devops repo, not this stack.
install -d /opt/townsquare

# 4. Shared edge network the edge Caddy and this app both join.
docker network inspect edge >/dev/null 2>&1 || docker network create edge

cat <<'NOTE'
Next:
  1. Bring up the edge Caddy first (droplet-devops repo): it owns 80/443 and
     routes townsquare.somedaysomehow.beer -> townsquare:8787 over the `edge`
     network. This stack publishes no host ports.
  2. Copy docker-compose.yml to /opt/townsquare/
  3. Point DNS: townsquare.somedaysomehow.beer  A  <this droplet IP>
  4. Authenticate to GHCR so compose can pull the private image:
       echo <GHCR_PAT> | docker login ghcr.io -u <github-user> --password-stdin
     (or make the GHCR package public and skip this)
  5. cd /opt/townsquare && docker compose up -d
  6. Reload the edge Caddy, then verify:
       curl -fsS https://townsquare.somedaysomehow.beer/healthz
NOTE
