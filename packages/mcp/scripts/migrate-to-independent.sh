#!/usr/bin/env bash
# Migration script for independent deployment (ports 8080/8443)
# Run this on the server: /home/mcp-terraform-blueprints/terraform-infrastructure-blueprints/packages/mcp/

set -e
cd "$(dirname "$0")/.."

echo "=== Migrating to Independent Deployment (Ports 8080/8443) ==="
echo ""

# Step 1: Stop current stack
echo "Step 1: Stopping current MCP stack..."
docker compose down
echo "✓ Stopped"

# Step 2: Check firewall ports
echo ""
echo "Step 2: Checking firewall ports 8080 and 8443..."
if command -v ufw >/dev/null 2>&1; then
    echo "UFW detected. Checking ports..."
    if ! ufw status | grep -q "8443/tcp"; then
        echo "⚠ Port 8443 not open. Run: sudo ufw allow 8443/tcp && sudo ufw allow 8443/udp"
    fi
    if ! ufw status | grep -q "8080/tcp"; then
        echo "⚠ Port 8080 not open. Run: sudo ufw allow 8080/tcp"
    fi
else
    echo "⚠ UFW not found. Ensure ports 8080 and 8443 are open in your firewall."
fi

# Step 3: Verify configuration files
echo ""
echo "Step 3: Verifying configuration files..."
if [ ! -f .env ]; then
    echo "⚠ Missing .env file. Copy env.example to .env and configure."
    exit 1
fi

if ! grep -q "8443" .env 2>/dev/null; then
    echo "⚠ .env doesn't contain port 8443. Update MCP_BASE_URL and AUTH_BASE_URL."
fi

if ! grep -q "8443" docker-compose.yml 2>/dev/null; then
    echo "⚠ docker-compose.yml doesn't contain port 8443. Update configuration."
    exit 1
fi

echo "✓ Configuration files verified"

# Step 4: Deploy updated stack
echo ""
echo "Step 4: Deploying updated stack..."
docker compose pull
docker compose up -d
echo "✓ Deployed"

# Step 5: Wait for health check
echo ""
echo "Step 5: Waiting for services to be healthy..."
sleep 10

# Step 6: Verify deployment
echo ""
echo "Step 6: Verifying deployment..."
echo "Checking containers..."
docker compose ps

echo ""
echo "Checking Caddy logs (should show no port conflicts)..."
docker logs mcp-caddy --tail 20 2>&1 | grep -i "error\|port\|listen" || echo "✓ No errors in Caddy logs"

echo ""
echo "Testing health endpoint..."
if curl -f -s -o /dev/null -w "%{http_code}" https://mcp.ustwo.com:8443/health 2>/dev/null | grep -q "200"; then
    echo "✓ Health check passed"
else
    echo "⚠ Health check failed. Check logs: docker compose logs mcp-server"
fi

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Next steps:"
echo "1. Update MCP client configs to use: https://mcp.ustwo.com:8443/sse"
echo "2. Test OAuth flow: https://mcp.ustwo.com:8443/.well-known/oauth-authorization-server"
echo "3. Monitor logs: docker compose logs -f"
