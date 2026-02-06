---
name: code-generation
description: Generate Terraform from parameterized templates when adding a capability to an existing project. Do not use for studying or reading blueprint code—use MCP fetch_blueprint_file instead.
---

# Infrastructure Code Generation

**Overview.** This skill generates Terraform code locally from parameterized templates driven by blueprint manifests. Use it when adding a capability (e.g. RDS, SQS, Cognito) to an existing project; it saves tokens by producing 50–100 lines of pre-adapted code instead of fetching 200+ lines from the repository.

**When to use**
- User wants to **add a capability** to an existing project (e.g. "add RDS to my project")
- User needs to **generate code** from blueprint patterns with project-specific parameters
- User wants to **scaffold infrastructure** following blueprint standards
- LLM can **extract parameters** from context (naming, VPC, security groups) and generate code

**Do not use**
- User wants to **study or understand** how a blueprint works → use MCP `fetch_blueprint_file` instead
- User needs to **read existing blueprint code** → use MCP `fetch_blueprint_file` instead
- User asks "how does X work?" or "show me the RDS module" → use MCP `fetch_blueprint_file` instead

**Prerequisites**
- Manifest YAML for the blueprint. Manifests are read from the repository's **`blueprints/manifests/`** at repo root when the skill is run from the repo (single source of truth). For standalone/distributed use, point the skill at a copy of that directory or set the manifest path via configuration.
- Known snippet name from that manifest (e.g. `rds-module`, `ephemeral-password`)
- Parameters extracted from context (naming, VPC, security groups, etc.)

**Templates** use Terraform's convention (`.tftpl` extension, `${var}` placeholders) for consistency with HashiCorp's `templatefile()`. This skill is for **design-time** Terraform generation (Node.js renders templates before you run Terraform). For **runtime** file templating inside Terraform (e.g. user-data, policies), use Terraform's built-in `templatefile()` and `.tftpl` files.

**Execution steps (summary)**
1. Identify blueprint and snippet from manifests or MCP `search_blueprints` / `recommend_blueprint`
2. Extract parameters from conversation (naming, VPC IDs, subnet groups, security group IDs)
3. Build JSON payload: `{ "blueprint", "snippet", "params" }`
4. Run script: `cd skills/code-generation && node scripts/generate.js` with payload on stdin
5. Return generated Terraform to the user (optionally adapt)

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

Check available snippets in the repo's `blueprints/manifests/{blueprint-name}.yaml` (canonical location at repo root) or use MCP tools:
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
cd skills/code-generation
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

Check the repo's `blueprints/manifests/*.yaml` (at repo root) for available snippets. Currently available:

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
- Check template file exists: `skills/code-generation/templates/{template-name}` (e.g. `rds-module.tftpl`)
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

- **style-guide**: Catalog, patterns, workflow context, and when to use MCP vs this skill

## MCP Tools for Discovery

Use MCP tools to discover blueprints before generating:
- `search_blueprints()` - Find blueprints by keywords
- `recommend_blueprint()` - Get blueprint recommendation
- `find_by_project()` - Find blueprints used by projects

**Note**: For creating new blueprints, use `fetch_blueprint_file()` to study existing blueprints first.
