# ustwo Infrastructure Blueprints MCP Server

MCP (Model Context Protocol) server that makes AI assistants aware of ustwo's Terraform infrastructure blueprints.

## What It Does

Once configured, your AI assistant (Cursor, Claude Desktop, etc.) automatically knows about ustwo's blueprints. You can ask things like:

- "I have a fullstack app with PostgreSQL - how do I deploy to AWS?"
- "Add SQS queue processing to my existing Terraform"
- "Should I use Lambda or ECS for this API?"
- "I need to add Bedrock RAG to my project"

The AI uses the MCP server to recommend blueprints, extract patterns, and compare architectural options.

## Quick Start for Engineers

### Prerequisites

- Docker installed and running
- GitHub account that's a member of the ustwo org
- `gh` CLI installed ([install guide](https://cli.github.com/))

### Step 1: Add `read:packages` scope to GitHub CLI (one-time)

```bash
gh auth refresh -h github.com -s read:packages
```

This opens a browser to authorize the additional scope.

### Step 2: Login to GitHub Container Registry (one-time)

```bash
echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
```

You should see: `Login Succeeded`

### Step 3: Configure Cursor

Create or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/bertrindade/infra-mcp:latest"]
    }
  }
}
```

### Step 4: Restart Cursor

Quit Cursor completely (Cmd+Q) and reopen it.

### Step 5: Start using it!

Just ask naturally:

```
"I have a React + Node app with PostgreSQL running locally. How do I deploy to AWS?"
```

```
"I need to add async processing to my existing Terraform project"
```

```
"Should I use Lambda or ECS for my Python API?"
```

## Claude Desktop Setup

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/bertrindade/infra-mcp:latest"]
    }
  }
}
```

## Available Tools

| Tool | Description | Example Use Case |
|------|-------------|------------------|
| `search_blueprints` | Search blueprints by keyword | "Find async processing blueprints" |
| `get_blueprint_details` | Get full details of a blueprint | "Show me apigw-lambda-rds details" |
| `recommend_blueprint` | Get recommendation based on requirements | "I need PostgreSQL with containers" |
| `extract_pattern` | Get guidance on extracting a capability | "How do I add a queue to existing Terraform?" |
| `compare_blueprints` | Compare architectural approaches | "Lambda vs ECS - which should I use?" |

## Example Prompts

**Starting a new project:**
```
"I have a React + Node app with PostgreSQL running locally. How do I deploy to AWS?"
```

**Adding to existing infrastructure:**
```
"I have existing Terraform with API Gateway and Lambda. I need to add SQS for background processing."
```

**Making architectural decisions:**
```
"Should I use serverless Lambda or containers for my Python data processing API?"
```

**Adding AI capabilities:**
```
"I have S3 for document storage. How do I add Bedrock RAG for document Q&A?"
```

## Troubleshooting

### "denied" when pulling Docker image

Your `gh` CLI might be missing the `read:packages` scope. Run:

```bash
gh auth refresh -h github.com -s read:packages
```

Then re-login to Docker:

```bash
docker logout ghcr.io
echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
```

### MCP server not appearing in Cursor

1. Check that `~/.cursor/mcp.json` has valid JSON syntax
2. Ensure Docker Desktop is running
3. Restart Cursor completely (Cmd+Q, then reopen)
4. Try pulling the image manually: `docker pull ghcr.io/bertrindade/infra-mcp:latest`

### Docker is slow on first run

The first time Cursor calls the MCP server, Docker downloads the image (~200MB), which can take 10-15 seconds.

| | Without pre-pull | With pre-pull |
|---|---|---|
| **First MCP call** | ~10-15 seconds (downloads image) | Instant |
| **Subsequent calls** | Instant (cached) | Instant |

**Pre-pulling is optional** - Docker downloads it automatically on first use. But if you want instant response on your first query:

```bash
docker pull ghcr.io/bertrindade/infra-mcp:latest
```

---

## Alternative: Run from Source

If you prefer running from source instead of Docker:

```bash
# Clone the repo
git clone git@github.com:berTrindade/terraform-infrastructure-blueprints.git

# Build the MCP server
cd terraform-infrastructure-blueprints/mcp-server
npm install
npm run build
```

Then configure Cursor to run from source:

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

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Build Docker image locally
docker build -t infra-mcp .
```

## Publishing

The Docker image is automatically published when you push a tag:

```bash
git tag mcp-v1.0.1
git push origin mcp-v1.0.1
```

This creates:
- `ghcr.io/bertrindade/infra-mcp:1.0.1`
- `ghcr.io/bertrindade/infra-mcp:latest`
