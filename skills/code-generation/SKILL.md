---
name: code-generation
description: Generate Terraform from parameterized templates when adding a capability to an existing project. Do not use for studying or reading blueprint code—use MCP fetch_blueprint_file instead.
---

# Infrastructure Code Generation

## Workflow: When to Use This Skill

**Trigger phrases:** "add capability", "add RDS", "add Lambda", "extract pattern"

### Step-by-Step Procedure

1. **Identify the capability** (user request: "add RDS", "add queue", etc.)

2. **Determine if template exists:**
   - Check `templates/` directory for matching `.tftpl`
   - If exists: Use template rendering (fast, efficient)
   - If not: Use MCP to fetch reference implementation

3. **Get parameter definitions:**
   - Call MCP `fetch_blueprint_file` for relevant `variables.tf`
   - Extract parameter names, types, defaults from Terraform code
   - LLM infers required vs optional from descriptions and defaults

4. **Render template:**
   - Build JSON payload with `template` and `params`
   - Run `node scripts/generate.js` with payload on stdin (see Usage below)

5. **Apply style-guide rules:**
   - Load `style-guide` skill
   - Check naming conventions (e.g. `{project}-{env}-{resource}`)
   - Validate security patterns (ephemeral passwords, no hardcoded credentials)

6. **Present to user:**
   - Show generated Terraform code
   - Suggest next steps: `terraform plan`, run tests

---

**Overview.** This skill generates Terraform code locally from parameterized templates. Use it when adding a capability (e.g. RDS, SQS, Cognito) to an existing project; it saves tokens by producing 50–100 lines of pre-adapted code instead of fetching 200+ lines from the repository.

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
- Template file name (e.g. `rds-module.tftpl`, `ephemeral-password.tftpl`) from `skills/code-generation/templates/`
- Parameters extracted from context (naming, VPC, security groups, etc.)
- For parameter definitions, refer to the source blueprint's `variables.tf` file (single source of truth)

**Templates** use Terraform's convention (`.tftpl` extension, `${variable}` placeholders) for consistency with HashiCorp's `templatefile()`. This skill is for **design-time** Terraform generation (Node.js renders templates before you run Terraform). For **runtime** file templating inside Terraform (e.g. user-data, policies), use Terraform's built-in `templatefile()` and `.tftpl` files.

**Execution steps (summary)**
1. Identify template file name (e.g. `rds-module.tftpl`) from available templates
2. Extract parameters from conversation (naming, VPC IDs, subnet groups, security group IDs)
3. Reference source blueprint's `variables.tf` for parameter names and types (if needed)
4. Build JSON payload: `{ "template": "rds-module.tftpl", "params": {...} }`
5. Run script: `cd skills/code-generation && node scripts/generate.js` with payload on stdin
6. Return generated Terraform to the user (optionally adapt)

## How It Works

1. **LLM identifies intent**: "add capability" → use template generator
2. **LLM identifies template**: Find appropriate template file (e.g. `rds-module.tftpl`) from `templates/` directory
3. **LLM extracts parameters** from conversation history:
   - Naming conventions (e.g., `{project}-{env}-{component}`)
   - Existing VPC ID, subnet groups, security groups
   - Environment-specific values
4. **LLM optionally references** source blueprint's `variables.tf` to understand parameter names and types
5. **LLM calls skill** with JSON payload containing template name and parameters
6. **Skill executes script** that:
   - Renders template with parameter substitution (no validation - Terraform catches errors at plan time)
7. **Returns generated Terraform code** (typically 50-100 lines vs 200+ lines from repository)

## Usage

### Step 1: Identify Template File

Check available templates in `skills/code-generation/templates/`:
- `rds-module.tftpl` - RDS PostgreSQL module
- `ephemeral-password.tftpl` - Ephemeral password pattern
- `dynamodb-table.tftpl` - DynamoDB table
- `lambda-function.tftpl` - Lambda function
- `security-group.tftpl` - Security group
- `sqs-queue.tftpl` - SQS queue
- `cognito-user-pool.tftpl` - Cognito user pool
- `ecs-service.tftpl` - ECS service

Or use MCP tools to discover blueprints, then check which templates are available:
- `search_blueprints()` - Find blueprints by keywords
- `recommend_blueprint()` - Get blueprint recommendation
- `fetch_blueprint_file()` - Read blueprint's `variables.tf` to understand parameters

### Step 2: Extract Parameters from Context

From conversation history, extract:
- **Naming conventions**: Look for patterns like `myapp-dev-*`, `{project}-{env}-*`
- **VPC/networking**: Existing VPC IDs, subnet groups, security groups
- **Environment**: dev, staging, prod
- **Project name**: Used in resource identifiers

### Step 3: Reference Source Blueprint (Optional)

If parameter names/types are unclear, reference the source blueprint's `variables.tf`:
- Use MCP `fetch_blueprint_file()` to read `{blueprint}/modules/{module}/variables.tf`
- This shows required/optional parameters, types, defaults, and descriptions
- Example: `fetch_blueprint_file("apigw-lambda-rds", "modules/data/variables.tf")`

### Step 4: Build JSON Payload

```json
{
  "template": "rds-module.tftpl",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_name": "myapp",
    "engine_version": "15.4",
    "instance_class": "db.t3.micro",
    "allocated_storage": 20,
    "max_allocated_storage": 100,
    "db_subnet_group_name": "myapp-dev-db-subnets",
    "security_group_id": "sg-123456",
    "multi_az": false,
    "backup_retention_period": 7,
    "performance_insights_enabled": false,
    "deletion_protection": false,
    "skip_final_snapshot": true,
    "apply_immediately": true
  }
}
```

### Step 5: Execute Script

The skill executes:
```bash
cd skills/code-generation
node scripts/generate.js < payload.json
```

Or with inline JSON:
```bash
echo '{"template":"rds-module.tftpl","params":{...}}' | node scripts/generate.js
```

### Step 6: Return Generated Code

The script returns rendered Terraform code that can be directly used or adapted. Missing parameters will appear as `${undefined}` in the output - easy to spot and fix.

## Example Scenarios

### Scenario 1: Add RDS to Existing Project

**User**: "I need to add PostgreSQL RDS to my project"

**LLM actions**:
1. Identifies intent: "add capability" → use template generator
2. Identifies template: `rds-module.tftpl`
3. Optionally references source: `fetch_blueprint_file("apigw-lambda-rds", "modules/data/variables.tf")` to see all parameters
4. Extracts from history:
   - Project: `myapp`
   - Environment: `dev`
   - VPC: `vpc-123456`
   - Subnet group: `myapp-dev-db-subnets`
   - Security group: `sg-123456`
5. Builds payload:
```json
{
  "template": "rds-module.tftpl",
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
6. Executes script and returns generated code

### Scenario 2: Add Ephemeral Password Pattern

**User**: "I need the ephemeral password pattern for my database"

**LLM actions**:
1. Identifies intent: "add capability" → use template generator
2. Identifies template: `ephemeral-password.tftpl`
3. Extracts from history:
   - Password name: `db`
4. Builds payload:
```json
{
  "template": "ephemeral-password.tftpl",
  "params": {
    "password_name": "db",
    "password_length": 32,
    "password_version": 1
  }
}
```
5. Executes script and returns generated code

## Available Templates

Check `skills/code-generation/templates/` for available templates:

- `rds-module.tftpl` - Complete RDS PostgreSQL module (source: `apigw-lambda-rds/modules/data/`)
- `ephemeral-password.tftpl` - Ephemeral password generation pattern
- `dynamodb-table.tftpl` - DynamoDB table configuration
- `lambda-function.tftpl` - Lambda function with IAM role
- `security-group.tftpl` - Security group with least-privilege rules
- `sqs-queue.tftpl` - SQS queue with DLQ
- `cognito-user-pool.tftpl` - Cognito user pool
- `ecs-service.tftpl` - ECS Fargate service

For parameter definitions, reference the source blueprint's `variables.tf` file using MCP `fetch_blueprint_file()`.

## Parameter Extraction Guidelines

When extracting parameters from conversation history:

1. **Naming conventions**: Look for patterns in existing resource names
   - Example: If you see `myapp-dev-api`, use `myapp-dev-db` for database
2. **VPC/networking**: Extract from existing resources or ask user
   - VPC ID: `vpc-*`
   - Subnet groups: Look for `*-subnets` or `*-db-subnets`
   - Security groups: `sg-*`
3. **Environment**: Usually `dev`, `staging`, or `prod`
4. **Defaults**: Reference source blueprint's `variables.tf` for default values
5. **Required vs Optional**: Check source blueprint's `variables.tf` to see which parameters are required

## Error Handling

If script fails:
- Check template file exists: `skills/code-generation/templates/{template-name}` (e.g. `rds-module.tftpl`)
- Missing parameters will appear as `${undefined}` in output - easy to spot and fix
- Type errors will be caught by Terraform at `terraform plan` time
- Pattern violations (e.g., invalid RDS identifier) will be caught by AWS at `terraform apply` time

**Note**: No validation layer - Terraform and AWS provide fast feedback loops with clear error messages.

## Benefits

1. **Token savings**: Generate 50 lines vs fetching 200+ lines (~75% reduction)
2. **Pre-adapted code**: Variables already use project naming conventions
3. **Local execution**: No network calls, faster response
4. **Flexibility**: Generate variations based on parameters
5. **Maintainability**: Templates centralized, easy to update patterns
6. **Single source of truth**: Parameter definitions live in blueprint's `variables.tf`, not duplicated in manifests
7. **Simpler architecture**: No validation layer - Terraform and AWS catch errors with clear messages

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

Use MCP tools to discover blueprints and understand parameters:
- `search_blueprints()` - Find blueprints by keywords
- `recommend_blueprint()` - Get blueprint recommendation
- `find_by_project()` - Find blueprints used by projects
- `fetch_blueprint_file()` - Read blueprint's `variables.tf` to understand parameter names, types, and defaults

**Note**: For creating new blueprints, use `fetch_blueprint_file()` to study existing blueprints first. For generating code, reference the blueprint's `variables.tf` to understand what parameters are needed.
