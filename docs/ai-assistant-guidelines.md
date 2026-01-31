# AI Assistant Guidelines for Terraform Infrastructure Blueprints

This guide helps AI assistants properly reference blueprint patterns instead of providing generic Terraform code. Following these guidelines ensures that infrastructure code follows battle-tested patterns from real production projects.

## Core Principle

**Always check for blueprints first** - Before writing Terraform code, search for existing blueprint patterns that solve the same problem. Blueprints contain production-tested code from real client projects.

## When to Reference Blueprints

### Use Blueprints When

1. **Adding capabilities to existing projects** - Extract modules from blueprints
2. **Starting new projects** - Recommend and reference complete blueprints
3. **Cross-cloud migrations** - Use `find_by_project` to find equivalents
4. **Architectural decisions** - Use `compare_blueprints` for trade-offs

### Don't Use Blueprints When

1. **Simple one-off resources** - Single S3 bucket, IAM role without patterns
2. **Client-specific customizations** - After extracting blueprint modules
3. **Non-standard requirements** - When no blueprint matches the use case

## Using MCP Tools

The repository provides MCP tools for blueprint discovery. **ALWAYS use these tools before writing Terraform code.**

### Pre-Flight Checklist

Before writing any Terraform code, check:
- [ ] Are MCP tools available? (Look for `mcp_ustwo-infra_*` tools)
- [ ] Have I called `get_workflow_guidance()` or `list_available_tools()`?
- [ ] Have I called `recommend_blueprint()` for new projects?
- [ ] Have I called `extract_pattern()` for adding capabilities?
- [ ] Am I referencing blueprint files before writing code?

### 0. `get_workflow_guidance(task: "new_project" | "add_capability" | "migrate_cloud" | "general")`

**When to use**: **ALWAYS call this FIRST** before writing Terraform code to understand the correct workflow.

**Example**:
```
User: "I need to add RDS PostgreSQL to my existing Lambda API"

AI should:
1. Call get_workflow_guidance(task: "add_capability")
2. Follow the workflow steps provided
3. Call extract_pattern(capability: "database")
4. Reference blueprint files
5. Provide code examples from the blueprint
```

### 1. `list_available_tools()`

**When to use**: To discover what MCP tools are available and when to use them.

**Example**:
```
AI should call list_available_tools() at the start of infrastructure tasks
to understand what tools are available.
```

### 2. `extract_pattern(capability: "database")`

**When to use**: User wants to add a capability (database, queue, auth, etc.) to existing Terraform.

**Example**:

```
User: "I need to add RDS PostgreSQL to my existing Lambda API"

AI should:
1. Call extract_pattern(capability: "database")
2. Reference the returned blueprint modules
3. Show how to extract modules/data/ and modules/networking/
4. Provide code examples from the blueprint
```

**Available capabilities**: `database`, `queue`, `auth`, `events`, `ai`, `notifications`

### 2. `recommend_blueprint(...)`

**When to use**: User is starting a new project or needs infrastructure recommendations.

**Example**:

```
User: "I need a serverless API with PostgreSQL"

AI should:
1. Call recommend_blueprint(database: "postgresql", pattern: "sync")
2. Recommend apigw-lambda-rds blueprint
3. Reference the blueprint structure and patterns
4. Show how to download and customize
```

### 3. `find_by_project(project_name: "...")`

**When to use**: User mentions a project name or needs cross-cloud equivalents.

**Example**:

```
User: "I need what was done for Mavie but for AWS"

AI should:
1. Call find_by_project(project_name: "Mavie", target_cloud: "aws")
2. Identify Mavie uses appengine-cloudsql-strapi
3. Recommend AWS equivalent: alb-ecs-fargate-rds
4. Explain the differences and migration path
```

### 4. `compare_blueprints(comparison: "...")`

**When to use**: User needs help making architectural decisions.

**Example**:

```
User: "Should I use DynamoDB or RDS?"

AI should:
1. Call compare_blueprints(comparison: "dynamodb-vs-rds")
2. Present trade-offs from the comparison
3. Recommend based on use case
```

## Blueprint Pattern Requirements

When referencing blueprints, ensure code follows these patterns:

### 1. Ephemeral Passwords (Flow A)

**Wrong**: Store password in Secrets Manager

```hcl
resource "aws_secretsmanager_secret" "db" {
  name = "db-password"
}

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

**Reference**: `apigw-lambda-rds/environments/dev/main.tf` lines 22-26

### 2. IAM Database Authentication

**Wrong**: Applications use password authentication

```hcl
# Missing IAM auth configuration
resource "aws_db_instance" "main" {
  # No iam_database_authentication_enabled
}
```

**Right**: Enable IAM Database Authentication

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  # Applications use IAM tokens, not passwords
}

# Lambda IAM policy for RDS auth
resource "aws_iam_policy" "rds_auth" {
  policy = jsonencode({
    Statement = [{
      Action   = ["rds-db:connect"]
      Resource = "arn:aws:rds-db:*:*:dbuser:${db_resource_id}/${username}"
    }]
  })
}
```

**Reference**: `apigw-lambda-rds/modules/data/main.tf` line 69

### 3. Official Terraform Modules

**Wrong**: Raw VPC resources

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "private" {
  # Manual subnet creation...
}
```

**Right**: Use official Terraform AWS modules

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = [...]
  database_subnets = [...]
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf` lines 53-73

### 4. VPC Endpoints vs NAT Gateway

**Wrong**: NAT Gateway for Lambda (expensive, unnecessary)

```hcl
module "vpc" {
  enable_nat_gateway = true  # Expensive for Lambda
}
```

**Right**: VPC Endpoints for Lambda (cost-effective)

```hcl
module "vpc" {
  enable_nat_gateway = false  # Lambda uses VPC endpoints
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type = "Interface"
  subnet_ids        = module.vpc.private_subnets
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf` lines 64, 141-150

### 5. Module Structure

**Wrong**: Flat Terraform files with everything in one place

```hcl
# main.tf - everything mixed together
resource "aws_db_instance" "db" { }
resource "aws_lambda_function" "api" { }
resource "aws_api_gateway" "api" { }
```

**Right**: Organized module structure

```hcl
# environments/dev/main.tf - composition only
module "data" {
  source = "../../modules/data"
  # ...
}

module "api_lambda" {
  source = "../../modules/compute"
  # ...
}

module "api_gateway" {
  source = "../../modules/api"
  # ...
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf` - see module composition

## Extraction Workflow

When extracting patterns from blueprints:

### Step 1: Identify the Capability

Ask: "What capability does the user need?"

- Database → `extract_pattern(capability: "database")`
- Queue → `extract_pattern(capability: "queue")`
- Auth → `extract_pattern(capability: "auth")`

### Step 2: Get Blueprint Reference

The tool returns:

- Source blueprint name
- Modules to extract
- Integration steps
- MCP resource URIs for reference files

### Step 3: Reference Blueprint Files

Use MCP resource URIs to fetch actual code:

```
blueprints://aws/apigw-lambda-rds/modules/data/main.tf
blueprints://aws/apigw-lambda-rds/environments/dev/main.tf
```

### Step 4: Adapt to Existing Project

- Copy module code from blueprint
- Update variables to match existing naming conventions
- Adapt security groups to existing VPC
- Ensure IAM roles follow existing patterns

### Step 5: Provide Standalone Code

- Code must work without blueprint repository dependency
- Include all necessary variables and outputs
- Follow existing project conventions

## Examples: Correct vs Incorrect Responses

### Example 1: Adding RDS to Existing Project

**Incorrect Response**:

```hcl
# Generic Terraform - doesn't reference blueprints
resource "aws_db_instance" "main" {
  engine    = "postgres"
  password  = random_password.db.result  # Wrong pattern
  # Missing IAM auth, wrong password handling
}
```

**Correct Response**:

```
I'll help you add RDS PostgreSQL using the blueprint pattern. Let me get the workflow and extract the database pattern:

[Call get_workflow_guidance(task: "add_capability")]
[Call extract_pattern(capability: "database")]

Based on the apigw-lambda-rds blueprint, here's how to add RDS:

1. **Ephemeral Password Pattern** (Flow A):
```hcl
ephemeral "random_password" "db" {
  length  = 32
  special = true
}

module "data" {
  source = "./modules/data"
  
  db_password         = ephemeral.random_password.db.result
  db_password_version = 1
  # Password never stored in state
}
```

1. **Enable IAM Database Authentication**:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  password_wo         = var.db_password
  password_wo_version = var.db_password_version
}
```

1. **Reference Files**:

- See: blueprints://aws/apigw-lambda-rds/modules/data/main.tf
- See: blueprints://aws/apigw-lambda-rds/environments/dev/main.tf

```

### Example 2: Starting New Project

**Incorrect Response**:
```

Here's a generic serverless API setup:
[Provides raw Terraform without blueprint reference]

```

**Correct Response**:
```

Let me get the workflow guidance and recommend the right blueprint:

[Call get_workflow_guidance(task: "new_project")]
[Call recommend_blueprint(database: "postgresql", pattern: "sync")]

Based on your requirements, I recommend the **apigw-lambda-rds** blueprint:

- Serverless REST API with PostgreSQL
- Uses ephemeral passwords (Flow A)
- IAM Database Authentication
- VPC endpoints for cost efficiency

**Quick Start**:

```bash
# Download the blueprint (use your preferred method - git clone, GitHub CLI, etc.)
git clone https://github.com/berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/aws/apigw-lambda-rds/environments/dev
terraform init && terraform apply
```

**Key Patterns**:

- Ephemeral passwords: See environments/dev/main.tf lines 22-26
- IAM auth: See modules/data/main.tf line 69
- VPC endpoints: See environments/dev/main.tf lines 141-150

```

## Common Mistakes to Avoid

1. **Storing passwords in Secrets Manager** - Use ephemeral `password_wo` pattern
2. **Missing IAM Database Authentication** - Always enable for RDS/Aurora
3. **Using NAT Gateway for Lambda** - Use VPC endpoints instead
4. **Raw Terraform resources** - Use official modules (VPC, Lambda, API Gateway)
5. **Not referencing blueprints** - Always check for existing patterns first
6. **Generic code without context** - Reference specific blueprint files

## Quick Checklist

Before providing Terraform code, ask:

### MCP Tool Usage
- [ ] Did I call `get_workflow_guidance()` or `list_available_tools()` FIRST?
- [ ] Did I check for existing blueprints using MCP tools?
- [ ] Did I call `recommend_blueprint()` for new projects?
- [ ] Did I call `extract_pattern()` for adding capabilities?
- [ ] Am I referencing specific blueprint files via MCP resources?

### Code Patterns
- [ ] Am I using ephemeral passwords (`password_wo`) for databases?
- [ ] Is IAM Database Authentication enabled?
- [ ] Am I using official Terraform modules (VPC, Lambda, etc.)?
- [ ] Am I using VPC endpoints (not NAT Gateway) for Lambda?
- [ ] Does the code follow blueprint module structure?
- [ ] Is the code standalone (no blueprint repository dependency)?

### Workflow
- [ ] Did I follow the workflow guidance from `get_workflow_guidance()`?
- [ ] Did I reference blueprint files before writing code?
- [ ] Am I following production-tested patterns from blueprints?

## Additional Resources

- [Blueprint Catalog](blueprints/catalog.md) - Complete blueprint reference
- [Patterns](blueprints/patterns.md) - Key patterns (secrets, naming, VPC) with examples
- [Workflows](blueprints/workflows.md) - Step-by-step usage scenarios
- [Quick Reference](ai-quick-reference.md) - One-page lookup guide

## Summary

**Golden Rule**: When in doubt, reference a blueprint. Blueprints contain production-tested code from real client projects. Generic Terraform code may work, but blueprint patterns are battle-tested and follow best practices.

Always:
1. Use MCP tools to discover blueprints
2. Reference specific blueprint files
3. Follow blueprint patterns (ephemeral passwords, IAM auth, official modules)
4. Extract modules when adding capabilities
5. Provide standalone code adapted to the user's project
