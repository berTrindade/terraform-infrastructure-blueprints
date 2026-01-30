---
name: blueprint-template-generator
description: Generate Terraform code from parameterized templates based on blueprint manifests. Use when adding capabilities to existing projects (not for studying blueprints). Saves tokens by generating 50 lines instead of fetching 200+ lines from repository.
---

# Blueprint Template Generator

Generate Terraform code locally from parameterized templates, saving tokens and producing code already adapted to project conventions.

## When to Use

**Use this skill when:**
- User wants to **add a capability** to an existing project (e.g., "add RDS to my project")
- User needs to **generate code** based on blueprint patterns
- User wants to **scaffold infrastructure** following blueprint standards
- LLM needs to **extract parameters** from project history and generate code

**Do NOT use this skill when:**
- User wants to **study or understand** how a blueprint works → use `fetch_blueprint_file` MCP tool instead
- User needs to **read existing code** from blueprints → use `fetch_blueprint_file` MCP tool instead
- User asks "how does X work?" → use `fetch_blueprint_file` MCP tool instead

## How It Works

1. **LLM identifies intent**: "add capability" → use template generator
2. **LLM extracts parameters** from conversation history:
   - Naming conventions (e.g., `{project}-{env}-{component}`)
   - Existing VPC ID, subnet groups, security groups
   - Environment-specific values
3. **LLM calls skill** with JSON payload containing blueprint, snippet, and parameters
4. **Skill executes script** that:
   - Reads blueprint manifest YAML
   - Validates parameters
   - Renders template with placeholders replaced
5. **Returns generated Terraform code** (typically 50-100 lines vs 200+ lines from repository)

## Usage

### Step 1: Identify Blueprint and Snippet

Check available snippets in `blueprints/manifests/{blueprint-name}.yaml` or use MCP tools:
- `search_blueprints()` - Find blueprints by keywords
- `recommend_blueprint()` - Get blueprint recommendation

### Step 2: Extract Parameters from Context

From conversation history, extract:
- **Naming conventions**: Look for patterns like `myapp-dev-*`, `{project}-{env}-*`
- **VPC/networking**: Existing VPC IDs, subnet groups, security groups
- **Environment**: dev, staging, prod
- **Project name**: Used in resource identifiers

### Step 3: Build JSON Payload

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "engine_version": "15.4",
    "instance_class": "db.t3.micro",
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}
```

### Step 4: Execute Script

The skill executes:
```bash
cd skills/blueprint-template-generator
node scripts/generate.js < payload.json
```

Or with inline JSON:
```bash
echo '{"blueprint":"apigw-lambda-rds","snippet":"rds-module","params":{...}}' | node scripts/generate.js
```

### Step 5: Return Generated Code

The script returns rendered Terraform code that can be directly used or adapted.

## Example Scenarios

### Scenario 1: Add RDS to Existing Project

**User**: "I need to add PostgreSQL RDS to my project"

**LLM actions**:
1. Identifies intent: "add capability" → use template generator
2. Extracts from history:
   - Project: `myapp`
   - Environment: `dev`
   - VPC: `vpc-123456`
   - Subnet group: `myapp-dev-db-subnets`
   - Security group: `sg-123456`
3. Builds payload:
```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456"
  }
}
```
4. Executes script and returns generated code

### Scenario 2: Add Ephemeral Password Pattern

**User**: "I need the ephemeral password pattern for my database"

**LLM actions**:
1. Identifies intent: "add capability" → use template generator
2. Extracts from history:
   - Password name: `db`
3. Builds payload:
```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "ephemeral-password",
  "params": {
    "password_name": "db"
  }
}
```
4. Executes script and returns generated code

## Available Blueprints and Snippets

Check `blueprints/manifests/*.yaml` for available snippets. Currently available:

- **apigw-lambda-rds**:
  - `rds-module`: Complete RDS PostgreSQL module
  - `ephemeral-password`: Ephemeral password generation pattern

More blueprints and snippets will be added over time.

## Parameter Extraction Guidelines

When extracting parameters from conversation history:

1. **Naming conventions**: Look for patterns in existing resource names
   - Example: If you see `myapp-dev-api`, use `myapp-dev-db` for database
2. **VPC/networking**: Extract from existing resources or ask user
   - VPC ID: `vpc-*`
   - Subnet groups: Look for `*-subnets` or `*-db-subnets`
   - Security groups: `sg-*`
3. **Environment**: Usually `dev`, `staging`, or `prod`
4. **Defaults**: Use manifest defaults when parameter not specified

## Error Handling

If script fails:
- Check manifest file exists: `blueprints/manifests/{blueprint}.yaml`
- Check template file exists: `skills/blueprint-template-generator/templates/{template-name}`
- Validate required parameters are provided
- Check parameter types match manifest definitions

## Benefits

1. **Token savings**: Generate 50 lines vs fetching 200+ lines (~75% reduction)
2. **Pre-adapted code**: Variables already use project naming conventions
3. **Local execution**: No network calls, faster response
4. **Flexibility**: Generate variations based on parameters
5. **Maintainability**: Templates centralized, easy to update patterns

## When NOT to Use This Skill

**Use Blueprint Repository (MCP tools) instead when:**
- **Creating new blueprints** → Need to see complete structure, patterns, tests
- **Studying how blueprints work** → Need to see full code, architecture
- **Copying complete blueprint** → Need entire structure (modules, tests, docs)
- **Understanding complex patterns** → Need to see full implementation

**See**: `docs/blueprints/template-generator-vs-repo.md` for detailed comparison

## Related Skills

- **blueprint-guidance**: Workflow guidance for using blueprints
- **blueprint-catalog**: Discover available blueprints
- **blueprint-patterns**: Understand common patterns
- **create-blueprint**: Scaffold new blueprints (uses Blueprint Repository)

## MCP Tools for Discovery

Use MCP tools to discover blueprints before generating:
- `search_blueprints()` - Find blueprints by keywords
- `recommend_blueprint()` - Get blueprint recommendation
- `find_by_project()` - Find blueprints used by projects

**Note**: For creating new blueprints, use `fetch_blueprint_file()` to study existing blueprints first.
