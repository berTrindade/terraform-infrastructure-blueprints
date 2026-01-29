# ustwo Infrastructure Blueprints MCP Server

[![CI/CD](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/release.yml/badge.svg)](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/release.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fbertrindade%2Finfra--mcp-blue)](https://github.com/berTrindade/terraform-infrastructure-blueprints/pkgs/container/infra-mcp)
[![npm version](https://img.shields.io/badge/npm-%40bertrindade%2Finfra--mcp-1.0.2-blue)](https://github.com/berTrindade/terraform-infrastructure-blueprints)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.6.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server that makes AI assistants aware of ustwo's Terraform infrastructure blueprints.

## What It Does

Once configured, your AI assistant (Cursor, Claude Desktop, etc.) can recommend blueprints, extract patterns, and compare architectural options. Ask things like:

- "I have a fullstack app with PostgreSQL - how do I deploy to AWS?"
- "Add SQS queue processing to my existing Terraform"
- "Should I use Lambda or ECS for this API?"
- "I need to add Bedrock RAG to my project"

## Quick Start

### Prerequisites

- Docker installed and running
- GitHub account that's a member of the ustwo org
- `gh` CLI installed ([install guide](https://cli.github.com/))

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

| Tool                 | Description                                                              | Example Use Case                        |
|----------------------|--------------------------------------------------------------------------|-----------------------------------------|
| `recommend_blueprint` | Get blueprint recommendation with full details based on requirements | "I need PostgreSQL with containers" |
| `extract_pattern`     | Get guidance on extracting a capability from blueprints to existing project | "How do I add a queue to existing Terraform?" |

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
cd terraform-infrastructure-blueprints/mcp-server
npm install
npm run build
```

Then configure Cursor:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "node",
      "args": ["/path/to/terraform-infrastructure-blueprints/mcp-server/dist/index.js"]
    }
  }
}
```

## Architecture

The MCP server implements **Dynamic Context Discovery** patterns to minimize token consumption and startup overhead:

- **On-Demand Tool Execution**: Tools execute only when called
- **Progressive Disclosure**: Optional parameters for requesting full content
- **Lazy Resource Loading**: Resources registered at startup, content loaded when accessed
- **Sequential Workflow Guidance**: Step-by-step guidance for common tasks

See [ADR 0007](../../docs/adr/0007-dynamic-context-discovery-mcp.md) for detailed documentation of these patterns.

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

**On every push to `main` branch** (if `mcp-server/**` files change):

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
