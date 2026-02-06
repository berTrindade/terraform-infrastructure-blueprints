# MCP HTTP Server – Deployment Guide

Deploy the Infrastructure Blueprints MCP server so the team can use it at **https://mcp.ustwo.com**. Same pattern as youandustwo: **Docker only on the server** (no Node.js installed on the host).

## Prerequisites

- **Docker** and **Docker Compose** on the server (e.g. mu / Linux)
- **No Node.js** required on the host – the app runs inside the container
- Domain **mcp.ustwo.com** pointing to the server
- Google OAuth 2.0 credentials (same as used for local)

## Quick Start (Production on mu / Linux)

### 1. Prepare the server

```bash
# SSH to the server (e.g. mu)
ssh mcp-terraform-blueprints@10.17.0.10

# Clone the repo (or copy only the files below)
git clone <repository-url>
cd terraform-infrastructure-blueprints/packages/mcp
```

You only need these in the deploy directory:

- `docker-compose.yml`
- `Caddyfile`
- `.env` (create from step 2)

The image is pre-built and published to GitHub Container Registry; the server **pulls** it and does not build.

### 2. Configure environment

```bash
cp env.example .env
# Edit .env: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET (min 32 chars, e.g. openssl rand -base64 32)
```

`AUTH_BASE_URL` and `MCP_BASE_URL` are already set in `docker-compose.yml` to `https://mcp.ustwo.com`. Do not commit `.env`.

### 3. Deploy

```bash
./scripts/deploy.sh
```

Or manually: `mkdir -p logs/caddy && docker compose pull && docker compose up -d`.

This starts:

- **mcp-server** – Node app (from `ghcr.io/bertrindade/infra-mcp:latest`)
- **caddy** – Reverse proxy and TLS for `mcp.ustwo.com` → `mcp-server:3000`

### 4. Verify

```bash
# Health check
curl -f http://localhost:3000/health

# Logs
docker compose logs -f mcp-server
docker compose logs -f caddy
```

From outside: **https://mcp.ustwo.com/health** and **https://mcp.ustwo.com/.well-known/mcp-oauth-authorization-server**.

## How the image is built

- **On every push to `main`**: GitHub Actions builds and pushes `ghcr.io/bertrindade/infra-mcp:latest` (see `.github/workflows/docker-build.yml`).
- **On release**: The release workflow also builds and pushes versioned tags (e.g. `ghcr.io/bertrindade/infra-mcp:1.5.0`).

The server does **not** build the image; it only pulls and runs it.

## Updates

```bash
cd terraform-infrastructure-blueprints/packages/mcp

# Pull latest image and restart
docker compose pull
docker compose up -d
```

## Data and persistence

- The MCP server is stateless (no database or file uploads).
- Caddy stores TLS data in the `caddy_data` volume; logs go to `./logs/caddy/` if mounted as in the compose file.

## Security

- **HTTPS**: Caddy handles TLS (e.g. Let’s Encrypt) for `mcp.ustwo.com`.
- **OAuth**: Restrict to `@ustwo.com` via `COMPANY_DOMAIN` and Google OAuth consent.
- **Secrets**: Keep `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` only in `.env` on the server, never in the repo.

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Container exits | `docker compose logs mcp-server`; ensure all required env vars are set in `.env`. |
| 502 from Caddy | `mcp-server` not ready or not healthy; check `docker compose ps` and health endpoint. |
| OAuth redirect fails | In Google Cloud Console, ensure `https://mcp.ustwo.com/oauth/callback` is in authorized redirect URIs. |
| Certificate errors | Caddy needs ports 80/443 and DNS for `mcp.ustwo.com`; check `docker compose logs caddy`. |

## Summary

| Item | youandustwo | MCP (this server) |
|------|-------------|--------------------|
| Node on host | No | No |
| Run on server | `docker compose up -d` | `docker compose up -d` |
| Image | `ghcr.io/ustwo/youandustwo:latest` | `ghcr.io/bertrindade/infra-mcp:latest` |
| Reverse proxy | Caddy → youandustwo:3000 | Caddy → mcp-server:3000 |
| Env | `backend/.env` / compose env | `.env` in `packages/mcp/` |
