# Developer Workflow

This guide explains how developers use Skills and MCP tools together to work with infrastructure blueprints.

## Overview

The blueprint system uses a **two-part architecture** per ADR 0009:

- **Skills (Static Content)**: Instant access to catalog, patterns, and guidance
- **MCP Tools (Dynamic Discovery)**: Interactive tools for finding and accessing blueprints

## Skills vs MCP Tools

### Skills - Static Content (Instant Access)

Skills provide instant access to static content without network calls:

- **`blueprint-catalog`**: Blueprint catalog table, decision trees, cross-cloud equivalents
- **`blueprint-patterns`**: Common patterns (ephemeral passwords, VPC, naming, etc.)
- **`blueprint-guidance`**: Workflow guidance and MCP tool usage

**When to use**: Quick lookups, pattern references, decision trees

### MCP Tools - Dynamic Discovery (Interactive)

MCP tools provide dynamic discovery and on-demand file access:

- **`recommend_blueprint()`**: Get blueprint recommendations based on requirements
- **`search_blueprints()`**: Search for blueprints by keywords
- **`extract_pattern()`**: Get guidance on extracting capabilities
- **`find_by_project()`**: Find blueprints by project name
- **`fetch_blueprint_file()`**: Get specific blueprint files on-demand
- **`get_workflow_guidance()`**: Get step-by-step workflow guidance

**When to use**: Discovery workflows, finding specific files, getting recommendations

## Common Workflows

### Scenario 1: Starting a New Project

**Developer asks**: "I need a serverless API with PostgreSQL"

**Workflow**:

1. **AI uses MCP tool**: `recommend_blueprint(database: "postgresql", pattern: "sync")`
   - Returns: `apigw-lambda-rds` recommendation

2. **AI references Skills**: `blueprint-catalog` skill
   - Shows decision tree and catalog entry
   - Instant access, no network call

3. **AI uses MCP tool**: `fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "environments/dev/main.tf")`
   - Gets specific file on-demand during discovery

4. **AI references Skills**: `blueprint-patterns` skill
   - Shows common RDS patterns (ephemeral passwords, IAM auth, VPC endpoints)
   - Instant access, no network call

5. **AI provides**: Code examples combining Skills patterns + fetched file

### Scenario 2: Adding Capability to Existing Project

**Developer asks**: "How do I add RDS PostgreSQL to my existing Lambda API?"

**Workflow**:

1. **AI uses MCP tool**: `extract_pattern(capability: "database")`
   - Gets extraction guidance and module references

2. **AI references Skills**: `blueprint-patterns` skill
   - Shows RDS pattern best practices
   - Instant access, no network call

3. **AI uses MCP tool**: `fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")`
   - Gets specific modules to extract

4. **AI provides**: Adapted code following Skills patterns

### Scenario 3: Quick Pattern Lookup

**Developer asks**: "What's the pattern for ephemeral passwords in RDS?"

**Workflow**:

1. **AI references Skills**: `blueprint-patterns` skill
   - Instant answer from local Skills
   - No MCP call needed

### Scenario 4: Architectural Decision

**Developer asks**: "Should I use DynamoDB or RDS?"

**Workflow**:

1. **AI references Skills**: `blueprint-catalog` skill
   - Shows catalog entries for both options
   - Shows decision tree
   - Instant access, no network call

2. **AI uses MCP tool**: `get_workflow_guidance(task: "general")`
   - Gets workflow guidance for comparisons

3. **AI provides**: Comparison with trade-offs

## Migration from Old Workflow

### Before (Static Resources)

- **MCP resources**: `blueprints://catalog`, `blueprints://list`, `blueprints://aws/apigw-lambda-rds/main.tf`
- **Problem**: Hundreds of resource registrations at startup, slower IDE startup

### After (Skills + MCP Tools)

- **Skills**: `blueprint-catalog`, `blueprint-patterns` for instant access
- **MCP tools**: `fetch_blueprint_file()` for on-demand file access
- **Benefits**: Faster startup, instant pattern access, still can discover files

### Migration Steps

**If you were accessing MCP resources directly**:

- **Before**: `blueprints://aws/apigw-lambda-rds/main.tf` resource
- **After**: `fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "main.tf")` tool

**If you were using catalog/list resources**:

- **Before**: `blueprints://catalog` or `blueprints://list` resource
- **After**: Skills (`blueprint-catalog` and `blueprint-patterns`) for instant access
- **Or**: MCP tools (`search_blueprints()`, `recommend_blueprint()`) for discovery

## Benefits

- ⚡ **Faster IDE startup**: No hundreds of resource registrations
- ⚡ **Instant access**: Common patterns available via Skills (no network latency)
- ⚡ **Still flexible**: Can discover and fetch specific files via MCP tools
- ⚡ **Clear separation**: Skills for patterns, MCP for discovery

## Setup

1. **Install Skills**: Install `@bertrindade/blueprint-skill` package (installs Skills automatically)
2. **Configure MCP Server**: Set up MCP server for discovery tools
3. **Use Skills**: Reference Skills for common patterns (instant access)
4. **Use MCP Tools**: Use MCP tools for discovery and specific file access

See [mcp-server/README.md](../../mcp-server/README.md) and [packages/blueprint-skill/README.md](../../packages/blueprint-skill/README.md) for setup instructions.
