# @bertrindade/blueprint-skill

Cursor skill package that provides AI assistant guidance for using infrastructure blueprints in client projects. When installed, AI assistants (Cursor, Claude Desktop, etc.) will automatically reference production-tested blueprint patterns when writing Terraform code.

## What It Does

This package installs skills for multiple AI assistants (Cursor, Claude Desktop, GitHub Copilot) that guide them to:

- ✅ Reference blueprint patterns before writing generic Terraform code
- ✅ Use MCP server tools for blueprint discovery and pattern extraction
- ✅ Follow blueprint best practices (ephemeral passwords, IAM auth, VPC endpoints, etc.)
- ✅ Extract patterns from blueprints for existing projects
- ✅ Ensure generated code is standalone with zero external dependencies

## Installation

### Prerequisites: Configure npm for GitHub Packages

Since this package is published to GitHub Packages, you need to configure npm:

1. **Create/update `.npmrc` file** in your project root:
   ```
   @bertrindade:registry=https://npm.pkg.github.com
   ```

2. **Authenticate with GitHub Packages** (choose one method):
   
   **Option A: Using GitHub CLI** (recommended):
   ```bash
   echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc
   ```
   
   **Option B: Using Personal Access Token**:
   ```bash
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
   ```
   
   Create a token at: https://github.com/settings/tokens (requires `read:packages` scope)

**Note**: The `.npmrc` can be either project-level (in project root) or user-level (`~/.npmrc`). For team projects, consider using project-level configuration.

### Step 1: Install Package

```bash
npm install --save-dev @bertrindade/blueprint-skill
```

The package will automatically run setup after installation, which:
- Detects installed AI assistants (Cursor, Claude Desktop, GitHub Copilot)
- Installs skills to all detected agents using symlinks (efficient, with copy fallback)
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

### AI Assistant Skills

**Locations** (for each detected agent):
- `.cursor/skills/blueprint-guidance/SKILL.md` (Cursor)
- `.cursor/skills/blueprint-catalog/SKILL.md` (Cursor)
- `.cursor/skills/blueprint-patterns/SKILL.md` (Cursor)
- Similar paths for Claude Desktop and GitHub Copilot

The setup script automatically detects installed agents and installs skills to all of them. Skills are installed using symlinks for efficiency (with automatic copy fallback if symlinks aren't supported).

**Skills installed**:

1. **`blueprint-guidance`**: Workflow guidance for using blueprints
   - When to reference blueprints
   - How to use MCP tools
   - Common scenarios and workflows

2. **`blueprint-catalog`**: Static catalog content
   - Blueprint catalog table
   - Decision trees
   - Cross-cloud equivalents
   - Blueprint structure patterns

3. **`blueprint-patterns`**: Common patterns and best practices
   - Ephemeral passwords (Flow A)
   - IAM Database Authentication
   - VPC endpoints vs NAT Gateway
   - Naming conventions
   - Extractable patterns by capability

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
node node_modules/@bertrindade/blueprint-skill/bin/setup.js
```

## How It Works

```mermaid
graph TB
    subgraph "Client Project"
        PKG[@bertrindade/blueprint-skill]
        SKILLS[.cursor/skills/<br/>blueprint-guidance/<br/>blueprint-catalog/<br/>blueprint-patterns/]
        AGENTS[AGENTS.md]
    end
    
    subgraph "AI Assistant"
        AI[Cursor/Claude Desktop]
        AI --> |Reads| SKILLS
        AI --> |Reads| AGENTS
    end
    
    subgraph "MCP Server"
        MCP[MCP Server]
        MCP --> |Dynamic Discovery| BLUEPRINTS[Blueprint Repository]
    end
    
    AI --> |Uses Tools| MCP
    SKILLS -.->|References| MCP
```

1. **Skills (Static Content)**: Instant access to catalog, patterns, and guidance
   - `blueprint-catalog`: Catalog table, decision trees, cross-cloud equivalents
   - `blueprint-patterns`: Common patterns and best practices
   - `blueprint-guidance`: Workflow guidance and MCP tool usage

2. **MCP Server (Dynamic Discovery)**: Tools for interactive workflows
   - `recommend_blueprint()`: Get recommendations
   - `search_blueprints()`: Search by keywords
   - `extract_pattern()`: Extract capabilities
   - `fetch_blueprint_file()`: Get files on-demand

3. **AI Assistant**: Uses Skills for instant access, MCP tools for discovery

## Troubleshooting

### Package Installation Fails

If `npm install` fails with authentication errors:

1. **Verify `.npmrc` configuration**:
   ```bash
   # Check project-level config
   cat .npmrc
   
   # Check user-level config
   cat ~/.npmrc
   ```
   
   Ensure both contain:
   - `@bertrindade:registry=https://npm.pkg.github.com`
   - `//npm.pkg.github.com/:_authToken=...`

2. **Verify GitHub authentication**:
   ```bash
   # Test GitHub CLI authentication
   gh auth status
   
   # Test token access
   gh auth token
   ```

3. **Regenerate authentication**:
   ```bash
   # Using GitHub CLI
   gh auth refresh -h github.com -s read:packages
   echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc
   ```

4. **Check token scope**: Ensure your token has `read:packages` scope

### Skill Not Working

1. **Check installation**:
   ```bash
   # For Cursor
   ls -la .cursor/skills/blueprint-guidance/SKILL.md
   
   # For Claude Desktop
   ls -la .claude/skills/blueprint-guidance/SKILL.md
   
   # For GitHub Copilot
   ls -la .github/skills/blueprint-guidance/SKILL.md
   ```

2. **Restart your AI assistant**: Quit completely and reopen

3. **Re-run setup**: If skills aren't detected, run `npx blueprint-skill-setup` manually

4. **Check MCP server**: Ensure MCP server is configured and working

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

1. Check `node_modules/@bertrindade/blueprint-skill/templates/AGENTS.md`
2. Copy content to your `AGENTS.md` or append as needed

## Uninstallation

To remove the skill:

```bash
# Remove package
npm uninstall @bertrindade/blueprint-skill

# Remove skill files (optional)
rm -rf .cursor/skills/blueprint-guidance
rm -rf .claude/skills/blueprint-guidance
rm -rf .github/skills/blueprint-guidance

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
