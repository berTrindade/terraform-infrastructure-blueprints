# @ustwo/blueprint-skill

Cursor skill package that provides AI assistant guidance for using infrastructure blueprints in client projects. When installed, AI assistants (Cursor, Claude Desktop, etc.) will automatically reference production-tested blueprint patterns when writing Terraform code.

## What It Does

This package installs a Cursor skill that guides AI assistants to:

- ✅ Reference blueprint patterns before writing generic Terraform code
- ✅ Use MCP server tools for blueprint discovery and pattern extraction
- ✅ Follow blueprint best practices (ephemeral passwords, IAM auth, VPC endpoints, etc.)
- ✅ Extract patterns from blueprints for existing projects
- ✅ Ensure generated code is standalone with zero external dependencies

## Installation

### Step 1: Install Package

```bash
npm install --save-dev @ustwo/blueprint-skill
```

The package will automatically run setup after installation, which:
- Installs the Cursor skill to `.cursor/skills/blueprint-guidance/`
- Creates/updates `AGENTS.md` in your project root

### Step 2: Configure MCP Server (One-time per developer)

To enable blueprint discovery, configure the MCP server:

1. **Install prerequisites**:
   ```bash
   # Install gh CLI if not already installed
   # https://cli.github.com/
   ```

2. **Add GitHub Packages scope**:
   ```bash
   gh auth refresh -h github.com -s read:packages
   ```

3. **Login to GitHub Container Registry**:
   ```bash
   echo $(gh auth token) | docker login ghcr.io -u $(gh api user -q .login) --password-stdin
   ```

4. **Configure Cursor**:
   
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

5. **Restart Cursor**:
   
   Quit Cursor completely (Cmd+Q) and reopen it.

### Step 3: Verify Installation

After restarting Cursor, the AI assistant should:
- Reference blueprint patterns when writing Terraform
- Use MCP tools for blueprint discovery
- Follow blueprint best practices automatically

## Usage

Once installed and configured, simply ask your AI assistant infrastructure questions:

### Example 1: Adding a Database

**You**: "I need to add RDS PostgreSQL to my existing Lambda API"

**AI will**:
1. Use MCP tools to find the `apigw-lambda-rds` blueprint
2. Extract the database pattern
3. Show ephemeral password configuration
4. Show IAM database authentication
5. Adapt code to your existing project

### Example 2: Starting New Project

**You**: "I need a serverless API with PostgreSQL"

**AI will**:
1. Recommend the `apigw-lambda-rds` blueprint
2. Provide download instructions
3. Reference key patterns from the blueprint
4. Guide you through setup

### Example 3: Architectural Decision

**You**: "Should I use DynamoDB or RDS?"

**AI will**:
1. Compare relevant blueprints
2. Explain trade-offs
3. Recommend based on your use case

## What Gets Installed

### Cursor Skill

**Location**: `.cursor/skills/blueprint-guidance/SKILL.md`

This skill file guides AI assistants on:
- When to reference blueprints
- How to use MCP tools
- Key blueprint patterns to follow
- Common scenarios and workflows

### AGENTS.md

**Location**: Project root `AGENTS.md`

Minimal AGENTS.md that:
- References the blueprint repository
- Explains the consultancy model
- Points to MCP server configuration
- Links to documentation

**Note**: If `AGENTS.md` already exists, the package will append blueprint guidance to it.

## Manual Setup

If you need to run setup manually:

```bash
npx blueprint-skill-setup
```

Or if installed locally:

```bash
node node_modules/@ustwo/blueprint-skill/bin/setup.js
```

## How It Works

```mermaid
graph TB
    subgraph "Client Project"
        PKG[@ustwo/blueprint-skill]
        SKILL[.cursor/skills/blueprint-guidance/]
        AGENTS[AGENTS.md]
    end
    
    subgraph "AI Assistant"
        AI[Cursor/Claude Desktop]
        AI --> |Reads| SKILL
        AI --> |Reads| AGENTS
    end
    
    subgraph "MCP Server"
        MCP[MCP Server]
        MCP --> |Fetches| BLUEPRINTS[Blueprint Repository]
    end
    
    AI --> |Uses| MCP
    SKILL -.->|References| MCP
```

1. **Skill Package**: Provides guidance to AI assistants
2. **MCP Server**: Provides blueprint discovery and file access
3. **AI Assistant**: Uses both to generate blueprint-aware code

## Troubleshooting

### Skill Not Working

1. **Check installation**:
   ```bash
   ls -la .cursor/skills/blueprint-guidance/SKILL.md
   ```

2. **Restart Cursor**: Quit completely (Cmd+Q) and reopen

3. **Check MCP server**: Ensure MCP server is configured and working

### MCP Server Not Available

1. **Check Docker**: Ensure Docker Desktop is running

2. **Check authentication**:
   ```bash
   gh auth status
   docker pull ghcr.io/bertrindade/infra-mcp:latest
   ```

3. **Check configuration**: Verify `~/.cursor/mcp.json` syntax

### AGENTS.md Not Created

The package will not overwrite existing `AGENTS.md` if it already contains blueprint guidance. To update manually:

1. Check `node_modules/@ustwo/blueprint-skill/templates/AGENTS.md`
2. Copy content to your `AGENTS.md` or append as needed

## Uninstallation

To remove the skill:

```bash
# Remove package
npm uninstall @ustwo/blueprint-skill

# Remove skill file (optional)
rm -rf .cursor/skills/blueprint-guidance

# Remove AGENTS.md content (optional, manual edit)
# Edit AGENTS.md to remove blueprint guidance section
```

## Package Structure

```
packages/blueprint-skill/
├── package.json              # Package configuration
├── README.md                 # This file
├── bin/
│   └── setup.js             # Setup script
└── templates/
    ├── .cursor/
    │   └── skills/
    │       └── blueprint-guidance/
    │           └── SKILL.md  # Cursor skill file
    └── AGENTS.md            # AGENTS.md template
```

## Requirements

- **Node.js**: >= 18
- **Cursor**: Latest version (or compatible AI assistant)
- **MCP Server**: Configured separately (see [mcp-server/README.md](../../mcp-server/README.md))

## Related Packages

- **[@bertrindade/infra-mcp](../../mcp-server/README.md)**: MCP server for blueprint discovery

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues)
- **Documentation**: [Blueprint Repository](https://github.com/berTrindade/terraform-infrastructure-blueprints)
