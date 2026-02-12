#!/usr/bin/env bash
# Deploy MCP HTTP server (production). Run from packages/mcp/.
# Requires: Docker, Docker Compose, .env with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET.

set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env. Copy env.example to .env and set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET."
  exit 1
fi

# Note: logs/caddy mount removed from docker-compose.yml for independent deployment
docker compose pull
docker compose up -d
echo "Done. Check: docker compose logs -f mcp-server"
echo "Verify: curl -I https://mcp.ustwo.com:8443/health"
