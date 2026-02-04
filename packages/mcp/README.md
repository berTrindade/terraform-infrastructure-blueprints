# ustwo Infrastructure Blueprints MCP Server

[![CI/CD](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/release.yml/badge.svg)](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/release.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fbertrindade%2Finfra--mcp-blue)](https://github.com/berTrindade/terraform-infrastructure-blueprints/pkgs/container/infra-mcp)
[![GitHub release](https://img.shields.io/github/v/release/berTrindade/terraform-infrastructure-blueprints?label=version)](https://github.com/berTrindade/terraform-infrastructure-blueprints/releases)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server that makes AI assistants aware of ustwo's Terraform infrastructure blueprints.

## What It Does

The MCP server provides **dynamic discovery tools** for finding and accessing blueprints. Static content (catalog, patterns) is provided via Skills for instant access.

**MCP Tools (Dynamic Discovery)**:
- Recommend blueprints based on requirements
- Search for blueprints by keywords
- Extract patterns from blueprints
- Find blueprints by project name
- Fetch specific blueprint files on-demand

**Skills (Static Content)**:
- Blueprint best practices (consolidated: catalog, patterns, workflow guidance with priority levels)

Once configured, your AI assistant can recommend blueprints, extract patterns, and compare architectural options. Ask things like:

- "I have a fullstack app with PostgreSQL - how do I deploy to AWS?"
- "Add SQS queue processing to my existing Terraform"
- "Should I use Lambda or ECS for this API?"
- "I need to add Bedrock RAG to my project"

## Quick Start

### Prerequisites

- Docker installed and running
- GitHub account that's a member of the ustwo org
- `gh` CLI installed ([install guide](https://cli.github.com/))

### Authentication

The MCP server supports OAuth 2.0 authentication with automatic detection by Cursor. When OAuth is configured, Cursor will automatically show a "Connect" button and handle the OAuth flow with PKCE.

**OAuth is optional** - if `AUTH_SERVER_URL` is not set, the server runs without authentication.

### Step 1: Add `read:packages` scope to GitHub CLI (one-time)

```bash
gh auth refresh -h github.com -s read:packages
```

### Step 2: Login to GitHub Container Registry (one-time)

```bash
echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
```

### Step 3: Configure Cursor

Create or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--pull", "always", "ghcr.io/bertrindade/infra-mcp:latest"]
    }
  }
}
```

**Automatic Updates:** With `--pull always`, developers automatically get the latest version on every MCP server connection. No manual updates or restarts needed!

### Step 4: Restart Cursor

Quit Cursor completely (Cmd+Q) and reopen it.

### Step 5: Authenticate (if OAuth is enabled)

If the MCP server is configured with OAuth (`AUTH_SERVER_URL` environment variable), Cursor will automatically:

1. **Detect authentication requirement** - Shows "Needs authentication" with a "Connect" button
2. **Handle OAuth flow** - When you click "Connect", Cursor opens your browser to the OAuth URL
3. **Authenticate with Google** - You'll be prompted to sign in with your Google account
4. **Verify company domain** - The auth service validates your email domain matches the required company domain
5. **Store token automatically** - Cursor stores the token and uses it for all MCP requests

**OAuth Flow:**
```
1. Cursor generates PKCE code_verifier and code_challenge
2. Cursor redirects to: https://auth.yourdomain.com/oauth/authorize?...
3. User authenticates with Google
4. Auth service validates company domain
5. Redirects back to cursor://anysphere.cursor-mcp/oauth/callback?code=...
6. Cursor exchanges code for token
7. Token stored automatically - MCP server now works
```

No manual token management needed - Cursor handles everything automatically!

## HTTP Mode (Like Jam)

The MCP server supports HTTP-based access similar to Jam's implementation. This allows clients to connect via a simple URL without requiring Docker or local setup.

### Benefits

- **Simple Configuration**: Just a URL, like Jam
- **No Local Docker**: Works from any client without Docker
- **Automatic OAuth**: Integrated authentication flow
- **Scalable**: HTTP server can handle multiple clients

### Deployment

Deploy using Docker Compose:

```bash
cd packages/mcp
docker-compose up -d
```

This starts:
- **MCP HTTP Server** on port 3000
- **Caddy** reverse proxy with HTTPS on ports 80/443

### Configuration

#### Cursor Configuration

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "url": "https://mcp.ustwo.com/mcp"
    }
  }
}
```

#### VS Code Configuration

```json
{
  "servers": {
    "ustwo-infra": {
      "url": "https://mcp.ustwo.com/mcp",
      "type": "http"
    }
  }
}
```

#### Claude Desktop Configuration

Add via UI or config:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "url": "https://mcp.ustwo.com/mcp"
    }
  }
}
```

OAuth authentication happens automatically when you connect. The server exposes OAuth metadata at `/.well-known/mcp-oauth-authorization-server`, which clients use to initiate the OAuth flow.

### Environment Variables

For HTTP mode deployment:

```bash
PORT=3000
AUTH_BASE_URL=https://mcp.ustwo.com
MCP_BASE_URL=https://mcp.ustwo.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COMPANY_DOMAIN=ustwo.com
JWT_SECRET=your-secret-key-min-32-chars
LOG_LEVEL=info
```

### Architecture

```
┌─────────────┐
│   Cursor   │
│  Claude    │  HTTPS
│  VS Code   │──────┐
└─────────────┘      │
                    ▼
            ┌───────────────┐
            │     Caddy     │
            │ HTTPS Proxy   │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  HTTP MCP     │
            │  Server       │
            │  (Express)    │
            └───────────────┘
```

The HTTP server:
- Handles MCP protocol over HTTP/SSE
- Integrates OAuth 2.0 endpoints
- Validates tokens on each request
- Supports multiple concurrent connections

## Claude Desktop Setup

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--pull", "always", "ghcr.io/bertrindade/infra-mcp:latest"]
    }
  }
}
```

**Automatic Updates:** With `--pull always`, developers automatically get the latest version. No manual updates needed!

## Available Tools

The MCP server provides **dynamic discovery tools only**. Static content (catalog, patterns) is in Skills.

| Tool                 | Description                                                              | Example Use Case                        |
|----------------------|--------------------------------------------------------------------------|-----------------------------------------|
| `recommend_blueprint` | Get blueprint recommendation with full details based on requirements | "I need PostgreSQL with containers" |
| `search_blueprints`  | Search for blueprints by keywords | "Find blueprints with DynamoDB" |
| `extract_pattern`     | Get guidance on extracting a capability from blueprints to existing project | "How do I add a queue to existing Terraform?" |
| `find_by_project`    | Find blueprints used by specific projects | "What blueprint did Mavie use?" |
| `fetch_blueprint_file` | Get specific blueprint files on-demand | "Show me the RDS module from apigw-lambda-rds" |
| `get_workflow_guidance` | Get step-by-step workflow guidance | "How do I start a new project?" |

**Note**: Static content (blueprint catalog, decision trees, common patterns) is provided via Skills (`infrastructure-style-guide`) for instant access without network calls. The new consolidated skill includes priority levels to help AI assistants prioritize recommendations.

## Using in Client Projects

For consultants working on client projects, install blueprint skills using the standard `npx skills` tool:

```bash
npx skills add bertrindade/terraform-infrastructure-blueprints
```

**Note**: The `infrastructure-style-guide` skill consolidates the previous three skills (`blueprint-catalog`, `blueprint-guidance`, `blueprint-patterns`) and adds priority levels.

This installs the blueprint skills to your AI assistant, providing:
- Instant access to blueprint patterns and best practices
- No network calls needed for common questions
- Works alongside this MCP server for complete blueprint awareness

Skills are distributed via [skills.sh](https://skills.sh/) and work with all agents that support the skills.sh standard.

## Troubleshooting

### "denied" when pulling Docker image

Your `gh` CLI might be missing the `read:packages` scope:

```bash
gh auth refresh -h github.com -s read:packages
docker logout ghcr.io
echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
```

### MCP server not appearing

1. Check that `~/.cursor/mcp.json` has valid JSON syntax
2. Ensure Docker Desktop is running
3. Restart Cursor completely (Cmd+Q, then reopen)
4. Try pulling the image manually: `docker pull ghcr.io/bertrindade/infra-mcp:latest`

### Slow first run

The first time Docker downloads the image (~200MB), which can take 10-15 seconds. Pre-pull for instant response:

```bash
docker pull ghcr.io/bertrindade/infra-mcp:latest
```

## Alternative: Run from Source

If you prefer running from source instead of Docker:

```bash
git clone git@github.com:berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/mcp
npm install
npm run build
```

Then configure Cursor:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "node",
      "args": ["/path/to/terraform-infrastructure-blueprints/mcp/dist/index.js"]
    }
  }
}
```

## Architecture

The MCP server implements **Dynamic Context Discovery** patterns per ADR 0007:

- **MCP for Discovery**: Tools provide dynamic discovery and on-demand file access
- **Skills for Static Content**: Catalog, patterns, and decision trees in Skills for instant access
- **On-Demand Tool Execution**: Tools execute only when called
- **Progressive Disclosure**: Optional parameters for requesting full content
- **Sequential Workflow Guidance**: Step-by-step guidance for common tasks

**Per ADR 0005**: Static resources (catalog, list, blueprint files) have been moved to Skills. MCP focuses on dynamic discovery workflows. The `infrastructure-style-guide` skill consolidates catalog, patterns, and workflow guidance with priority levels to help AI assistants prioritize recommendations.

See [ADR 0005](../../docs/adr/0005-skills-vs-mcp-decision.md) for detailed documentation.

## OAuth Configuration

The MCP server can be configured with OAuth 2.0 authentication. When configured, Cursor automatically detects the authentication requirement and handles the OAuth flow.

### Environment Variables

**MCP Server:**
- `AUTH_SERVER_URL` - OAuth authorization server URL (e.g., `https://auth.yourdomain.com`)
- `OAUTH_CLIENT_ID` - OAuth client ID (optional, for token validation)

**Auth Service:**
- `PORT` - Server port (default: 3000)
- `AUTH_BASE_URL` - Base URL for the auth service
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `COMPANY_DOMAIN` - Required company email domain (e.g., `ustwo.com`)
- `JWT_SECRET` - Secret key for JWT signing (min 32 characters)
- `DATABASE_URL` - Database URL for token storage (optional, uses in-memory by default)

### OAuth Server Setup

The OAuth authorization server is a separate service (`packages/auth-service/`). See [packages/auth-service/README.md](../auth-service/README.md) for setup instructions.

**Key Features:**
- OAuth 2.0 Authorization Code flow with PKCE
- Google OAuth integration
- Company domain verification
- JWT token generation
- Token validation endpoint

### User Flow

1. Developer adds MCP server to Cursor config
2. Cursor detects OAuth requirement → Shows "Connect" button
3. User clicks "Connect" → Cursor opens browser to OAuth URL
4. User authenticates with Google → Auth service validates domain
5. Redirects back to Cursor → Token exchange happens automatically
6. Token stored → MCP server works seamlessly

## Security

The MCP server implements comprehensive security measures including:

- **Input Validation**: All inputs validated for format, length, and dangerous patterns
- **Path Traversal Protection**: Comprehensive validation prevents directory traversal attacks
- **Command Injection Prevention**: Secure command execution using `execFile` with array arguments
- **Error Sanitization**: Error messages sanitized to prevent information disclosure
- **Container Security**: Docker containers run as non-root users
- **Security Testing**: Comprehensive test suite covering security controls

### Security Documentation

- **[SECURITY.md](./SECURITY.md)**: Complete security policy, threat model, and best practices
- **[ADR 0008](../../docs/adr/0008-mcp-server-security-hardening.md)**: Architecture decision record for security hardening

### Running Security Tests

```bash
npm test -- --grep "security"
```

## Development

```bash
npm install
npm run build
npm test
npx @modelcontextprotocol/inspector node dist/index.js
docker build -t infra-mcp .
```

## Publishing

Releases are **fully automated** using [semantic-release](https://github.com/semantic-release/semantic-release). No manual versioning or publishing needed!

### How It Works

**On every push to `main` branch** (if `mcp/**` files change):

1. **Tests run** - Ensures code quality
2. **semantic-release analyzes commits** - Checks for conventional commit format
3. **If release needed** (based on commit types):
   - Version bumped automatically (`feat:` → minor, `fix:` → patch, `feat!:` → major)
   - `CHANGELOG.md` generated
   - Git tag created (`v1.2.3`)
   - GitHub Release created
   - npm package published to GitHub Packages
   - Docker image built and pushed to GHCR with version tag and `latest`
4. **If no release needed** - Workflow completes (no version change)

### Commit Format

Use conventional commits for automatic versioning:

```bash
feat: add new feature      # Minor version bump (1.0.0 → 1.1.0)
fix: resolve bug           # Patch version bump (1.0.0 → 1.0.1)
feat!: breaking change     # Major version bump (1.0.0 → 2.0.0)
chore: update deps         # No release
```

### Release Artifacts

Each release automatically creates:

- **Git tag**: `v1.2.3`
- **GitHub Release**: With auto-generated changelog
- **npm package**: `@bertrindade/infra-mcp@1.2.3`
- **Docker images**:
  - `ghcr.io/bertrindade/infra-mcp:1.2.3` (versioned)
  - `ghcr.io/bertrindade/infra-mcp:latest` (always latest)

### How Developers Get Updates

Developers configured with `--pull always` automatically receive updates:

- **No manual pull needed** - Docker pulls latest on each connection
- **No restart required** - Cursor reconnects with new image automatically
- **Zero developer action** - Updates happen transparently

Releases are fully automated - just commit with conventional format and push to `main`.
