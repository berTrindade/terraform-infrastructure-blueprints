# ustwo Infrastructure Blueprints MCP Server

MCP (Model Context Protocol) server that makes AI assistants aware of ustwo's Terraform infrastructure blueprints.

## What It Does

Once configured, your AI assistant (Cursor, Claude Desktop, etc.) automatically knows about ustwo's blueprints. You can ask things like:

- "I have a fullstack app with PostgreSQL - how do I deploy to AWS?"
- "Add SQS queue processing to my existing Terraform"
- "Should I use Lambda or ECS for this API?"
- "I need to add Bedrock RAG to my project"

The AI uses the MCP server to recommend blueprints, extract patterns, and compare architectural options.

## Quick Start

### 1. Authenticate with GitHub Container Registry (one-time)

Same authentication as youandustwo - if you've already done this, skip to step 2.

```bash
# Login to GitHub Container Registry
docker login ghcr.io
# Username: your-github-username
# Password: your GitHub PAT with read:packages scope (or use: gh auth token)
```

Or using gh CLI:

```bash
echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
```

### 2. Configure Your AI Tool

#### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/ustwo/infra-mcp:latest"]
    }
  }
}
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "ghcr.io/ustwo/infra-mcp:latest"]
    }
  }
}
```

### 3. Restart Your AI Tool

After adding the configuration, restart Cursor or Claude Desktop. The MCP server will be available immediately.

## Available Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `search_blueprints` | Search blueprints by keyword | "Find async processing blueprints" |
| `get_blueprint_details` | Get full details of a blueprint | "Show me apigw-lambda-rds details" |
| `recommend_blueprint` | Get recommendation based on requirements | "I need PostgreSQL with containers" |
| `extract_pattern` | Get guidance on extracting a capability | "How do I add a queue to existing Terraform?" |
| `compare_blueprints` | Compare architectural approaches | "Lambda vs ECS - which should I use?" |

## Example Prompts

Once configured, try these natural language prompts:

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

## Available Resources

| Resource | Description |
|----------|-------------|
| `blueprints://catalog` | Full AI context (AGENTS.md content) |
| `blueprints://list` | JSON list of all blueprints |

## Alternative: Run from Source

If you have the blueprints repo cloned locally:

```bash
# Clone the repo
git clone git@github.com:ustwo/terraform-infrastructure-blueprints.git

# Build the MCP server
cd terraform-infrastructure-blueprints/mcp-server
npm install
npm run build
```

Then configure your AI tool to run from source:

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

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode (watch)
npm run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Build Docker image locally
docker build -t infra-mcp .

# Run Docker image locally
docker run --rm -i infra-mcp
```

## Publishing

The Docker image is automatically published to GitHub Container Registry when you push a tag:

```bash
# Tag a new version
git tag mcp-v1.0.0
git push origin mcp-v1.0.0
```

This creates:
- `ghcr.io/ustwo/infra-mcp:1.0.0`
- `ghcr.io/ustwo/infra-mcp:latest`

Or publish manually via GitHub Actions workflow dispatch.

## Troubleshooting

### "unauthorized" when pulling Docker image

Your Docker isn't authenticated to ghcr.io. Run:

```bash
docker login ghcr.io
```

Use your GitHub username and a PAT with `read:packages` scope.

### "manifest unknown" error

The image hasn't been published yet. Either:
1. Wait for CI to publish after tagging
2. Run from source (see Alternative section above)

### MCP server not appearing in Cursor

1. Check that `~/.cursor/mcp.json` has valid JSON syntax
2. Ensure Docker is running
3. Restart Cursor completely (Cmd+Q, then reopen)
4. Check Cursor's MCP logs for errors

### Tool calls returning errors

Run the Docker image directly to see error output:

```bash
docker run --rm -i ghcr.io/ustwo/infra-mcp:latest
```

### Docker is slow to start

The first run downloads the image. Subsequent runs use the cached image and start instantly.

To pre-pull the image:

```bash
docker pull ghcr.io/ustwo/infra-mcp:latest
```
