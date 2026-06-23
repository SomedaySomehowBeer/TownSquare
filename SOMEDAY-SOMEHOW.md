# Someday Somehow fork notes

A self-hosted, single-site fork of [TownSquare](https://github.com/cauenapier/TownSquare),
running at `https://townsquare.somedaysomehow.beer`.

## What changed vs upstream
- **Character** — `public/widget/figure.mjs` is a side-on profile rig; `public/widget.css`
  carries an appended "bold silhouette skin" block (fat round-capped strokes = solid
  rounded-capsule limbs, scaling stroke, centre-line joint pivots). The walk-cycle and
  pose keyframes are upstream, untouched.
- **Isolation** — single server, no `siteKey`, no `connections`, `SERVICE_ADMIN_PASSWORD`
  unset. `ops/Caddyfile` also 404s `/register*` and `/service-admin*` so the site can't be
  used to register others or expose an operator panel. The token-gated `/admin` moderation
  page is kept.
- **Deploy** — `Dockerfile` (upstream) + `docker-compose.yml` + `ops/Caddyfile` (TLS + WS) +
  `.github/workflows/deploy.yml` (build to GHCR, deploy over SSH) + `scripts/bootstrap.sh`.

## License
See `NOTICE`. Used with the author's permission.
