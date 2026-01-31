---
name: blueprint-guidance
description: Guide AI assistants to reference infrastructure blueprint patterns when writing Terraform code. Use when writing infrastructure code, adding capabilities, or making architectural decisions.
---

# Blueprint Guidance

## Overview

This skill ensures AI assistants reference production-tested infrastructure blueprint patterns instead of generating generic Terraform code. Blueprints contain battle-tested patterns from real client projects and follow best practices for security, cost optimization, and maintainability.

## When to Use

- Writing Terraform code for infrastructure
- Adding capabilities to existing infrastructure (database, queue, auth, etc.)
- Making architectural decisions (serverless vs containers, DynamoDB vs RDS, etc.)
- Starting new infrastructure projects
- Extracting patterns from blueprints for existing projects

## Core Principle

**Always check for blueprints first** - Before writing Terraform code, search for existing blueprint patterns that solve the same problem. Blueprints contain production-tested code from real client projects.

## Pre-Flight Checklist

Before writing any Terraform code, check:

- [ ] Are MCP tools available? (Look for `mcp_ustwo-infra_*` tools)
- [ ] Have I checked Skills for static content? (`blueprint-catalog`, `blueprint-patterns`)
- [ ] Have I called `get_workflow_guidance()` to understand the correct workflow?
- [ ] Have I called `recommend_blueprint()` for new projects?
- [ ] Have I called `extract_pattern()` for adding capabilities?
- [ ] Am I referencing blueprint files before writing code?

## Workflow Guidance

### Step 1: Determine the Scenario

Identify which scenario applies:

1. **New Project** - Starting infrastructure from scratch
2. **Add Capability** - Adding features to existing Terraform
3. **Migrate Cloud** - Moving between AWS/Azure/GCP
4. **Compare Options** - Making architectural decisions

### Step 2: Use MCP Tools

**ALWAYS call `get_workflow_guidance()` FIRST** to understand the correct workflow:

```typescript
// For new projects
get_workflow_guidance(task: "new_project")

// For adding capabilities
get_workflow_guidance(task: "add_capability")

// For cloud migrations
get_workflow_guidance(task: "migrate_cloud")
```

### Step 3: Discover Blueprints

**For static content (catalog, patterns)**: Reference Skills for instant access:
- **`blueprint-catalog`** - Blueprint catalog, decision trees, cross-cloud equivalents
- **`blueprint-patterns`** - Common patterns (ephemeral passwords, VPC, naming, etc.)

**For dynamic discovery**: Use MCP tools to find relevant blueprints:
- **`recommend_blueprint()`** - Get blueprint recommendation based on requirements
- **`search_blueprints()`** - Search for blueprints by keywords
- **`extract_pattern()`** - Get guidance on extracting specific capabilities
- **`find_by_project()`** - Find blueprints used by specific projects

### Step 4: Generate or Reference Code

**For adding capabilities to existing projects**: Use `blueprint-template-generator` skill to generate code locally:
- Saves tokens (generates 50 lines vs fetching 200+ lines)
- Code already adapted to project conventions
- Executes locally, no network calls

**For studying blueprints**: Use `fetch_blueprint_file()` to get actual code examples:

```typescript
fetch_blueprint_file(
  blueprint: "apigw-lambda-rds",
  path: "modules/data/main.tf"
)
```

**Decision**: 
- **"Add capability"** → Use `blueprint-template-generator` skill
- **"How does X work?"** or **"Study blueprint"** → Use `fetch_blueprint_file()` MCP tool

### Step 5: Follow Blueprint Patterns

**Reference `blueprint-patterns` skill** for detailed pattern documentation. Key patterns:

#### 1. Ephemeral Passwords (Flow A)

**Wrong**: Store password in Secrets Manager or state

```hcl
resource "aws_secretsmanager_secret_version" "db" {
  secret_string = random_password.db.result  # Password in state!
}
```

**Right**: Use ephemeral password with `password_wo`

```hcl
ephemeral "random_password" "db" {
  length  = 32
  special = true
}

resource "aws_db_instance" "main" {
  password_wo         = ephemeral.random_password.db.result
  password_wo_version = 1
  # Password NEVER in terraform.tfstate
}
```

#### 2. IAM Database Authentication

**Always enable** IAM Database Authentication for RDS/Aurora:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  # Applications use IAM tokens, not passwords
}
```

#### 3. Official Terraform Modules

**Use official modules** instead of raw resources:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  # ...
}
```

#### 4. VPC Endpoints vs NAT Gateway

**For Lambda**: Use VPC endpoints (cost-effective)

```hcl
module "vpc" {
  enable_nat_gateway = false  # Lambda uses VPC endpoints
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type = "Interface"
}
```

#### 5. Module Structure

**Organize code** into modules:

```hcl
# environments/dev/main.tf - composition only
module "data" {
  source = "../../modules/data"
}

module "api_lambda" {
  source = "../../modules/compute"
}
```

## Common Scenarios

### Scenario 1: Adding RDS to Existing Project

**User says**: "I need to add RDS PostgreSQL to my existing Lambda API"

**AI should**:
1. Call `get_workflow_guidance(task: "add_capability")`
2. Call `extract_pattern(capability: "database")`
3. **Use `blueprint-template-generator` skill** to generate RDS module code:
   - Extract parameters from project history (naming, VPC, security groups)
   - Build JSON payload with blueprint, snippet, and params
   - Execute template generator script
   - Return generated Terraform code (already adapted to conventions)
4. Show ephemeral password pattern
5. Show IAM database authentication
6. Adapt generated code to existing project if needed

### Scenario 2: Starting New Project

**User says**: "I need a serverless API with PostgreSQL"

**AI should**:
1. Call `get_workflow_guidance(task: "new_project")`
2. Call `recommend_blueprint(database: "postgresql", pattern: "sync")`
3. Recommend `apigw-lambda-rds` blueprint
4. Provide download instructions
5. Reference key patterns from blueprint

### Scenario 3: Architectural Decision

**User says**: "Should I use DynamoDB or RDS?"

**AI should**:
1. Call `get_workflow_guidance(task: "general")`
2. Compare blueprints: `apigw-lambda-dynamodb` vs `apigw-lambda-rds`
3. Explain trade-offs
4. Recommend based on use case

## Key Patterns Reference

**For detailed pattern documentation, see `blueprint-patterns` skill.**

Quick reference:

### Database Patterns

- **Ephemeral passwords**: Use `password_wo` attribute, never store in state
- **IAM auth**: Always enable `iam_database_authentication_enabled`
- **VPC endpoints**: Use for Lambda (not NAT Gateway)
- **Security groups**: Least-privilege access

### Queue Patterns

- **Dead letter queues**: Always configure DLQ for SQS
- **Visibility timeout**: Set appropriately for processing time
- **Batch processing**: Use batch size for cost optimization

### Auth Patterns

- **Cognito**: Use for user authentication
- **IAM roles**: Use for service-to-service auth
- **Least privilege**: Minimal permissions required

## Standalone Code Requirement

**Critical**: All code provided must be standalone with zero dependencies on the blueprint repository.

- ✅ Copy module code directly
- ✅ Include all necessary variables and outputs
- ✅ Adapt to existing project conventions
- ❌ No references to blueprint repository
- ❌ No external dependencies on ustwo systems

## Related Skills

- **`blueprint-catalog`**: Blueprint catalog, decision trees, cross-cloud equivalents
- **`blueprint-patterns`**: Common patterns (ephemeral passwords, VPC, naming, etc.)
- **`blueprint-template-generator`**: Generate Terraform code from parameterized templates (for adding capabilities)

## Workflow: Skills vs MCP Tools

**Skills (Static Content)** - Instant access, no network calls:
- `blueprint-catalog`: Catalog table, decision trees, cross-cloud equivalents
- `blueprint-patterns`: Common patterns and best practices
- `blueprint-template-generator`: Generate code from templates (for adding capabilities)

**MCP Tools (Dynamic Discovery)** - For interactive workflows:
- `recommend_blueprint()`: Get recommendations based on requirements
- `search_blueprints()`: Search for blueprints by keywords
- `extract_pattern()`: Get extraction guidance for capabilities
- `find_by_project()`: Find blueprints by project name
- `fetch_blueprint_file()`: Get specific files on-demand during discovery
- `get_workflow_guidance()`: Get step-by-step workflow guidance

## References

- **MCP Server**: Configured separately - provides blueprint discovery tools
- **Blueprint Repository**: https://github.com/berTrindade/terraform-infrastructure-blueprints
- **AI Guidelines**: See `docs/ai-assistant-guidelines.md` in blueprint repository
- **Pattern Examples**: See `docs/blueprints/patterns.md` (includes wrong vs right examples)

## Checklist

Before providing Terraform code:

- [ ] Called `get_workflow_guidance()` to understand workflow
- [ ] Used MCP tools to discover relevant blueprints
- [ ] Referenced specific blueprint files
- [ ] Followed blueprint patterns (ephemeral passwords, IAM auth, etc.)
- [ ] Code is standalone (no blueprint repository dependencies)
- [ ] Adapted to existing project conventions (if applicable)
