# ustwo Infrastructure Blueprints MCP Server

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

The Docker image is automatically published when you push changes to `mcp-server/**`:

### Automatic Publishing

**On every push to `main` branch** (if `mcp-server/**` files change):

- `ghcr.io/bertrindade/infra-mcp:latest` is automatically updated
- Developers get the update automatically (no action needed)

**When you push a version tag:**

```bash
git tag mcp-v1.0.1
git push origin mcp-v1.0.1
```

This creates:

- `ghcr.io/bertrindade/infra-mcp:1.0.1` (versioned tag)
- `ghcr.io/bertrindade/infra-mcp:latest` (always points to newest)

### How Developers Get Updates

Developers configured with `--pull always` automatically receive updates:

- ✅ **No manual pull needed** - Docker pulls latest on each connection
- ✅ **No restart required** - Cursor reconnects with new image automatically
- ✅ **Zero developer action** - Updates happen transparently

The `:latest` tag is always updated to point to the most recent build, ensuring developers always get the newest version.
