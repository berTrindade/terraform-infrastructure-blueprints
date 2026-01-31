# AI Assistant Guidelines

Guidelines for AI assistants working with Terraform Infrastructure Blueprints. This document ensures AI assistants properly reference blueprint patterns instead of providing generic Terraform code.

## Core Principle

**Always check for blueprints first** - Before writing Terraform code, search for existing blueprint patterns that solve the same problem. Blueprints contain production-tested code from real client projects.

### When to Reference Blueprints

- ✅ Adding capabilities to existing projects
- ✅ Starting new projects
- ✅ Cross-cloud migrations
- ✅ Architectural decisions

### When NOT to Reference Blueprints

- ❌ Simple one-off resources (single S3 bucket, IAM role)
- ❌ Client-specific customizations (after extracting blueprint modules)
- ❌ Non-standard requirements (when no blueprint matches)

## Pre-Flight Checklist

Before writing any Terraform code:
- [ ] Called `get_workflow_guidance()` or `list_available_tools()` FIRST?
- [ ] Called `recommend_blueprint()` for new projects?
- [ ] Called `extract_pattern()` for adding capabilities?
- [ ] Referencing blueprint files before writing code?

## Blueprint Pattern Requirements

When referencing blueprints, ensure code follows these patterns:

### 1. Ephemeral Passwords (Flow A)

**Wrong**: Store password in Secrets Manager

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

**Reference**: `apigw-lambda-rds/environments/dev/main.tf:22-26`

### 2. IAM Database Authentication

**Right**: Enable IAM Database Authentication

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
}

resource "aws_iam_policy" "rds_auth" {
  policy = jsonencode({
    Statement = [{
      Action   = ["rds-db:connect"]
      Resource = "arn:aws:rds-db:*:*:dbuser:${db_resource_id}/${username}"
    }]
  })
}
```

**Reference**: `apigw-lambda-rds/modules/data/main.tf:69`

### 3. Official Terraform Modules

**Right**: Use official Terraform AWS modules

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr
  azs  = local.azs
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf:53-73`

### 4. VPC Endpoints vs NAT Gateway

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

**Reference**: `apigw-lambda-rds/environments/dev/main.tf:141-150`

### 5. Module Structure

**Right**: Organized module structure

```hcl
# environments/dev/main.tf - composition only
module "data" {
  source = "../../modules/data"
}

module "api_lambda" {
  source = "../../modules/compute"
}

module "api_gateway" {
  source = "../../modules/api"
}
```

## Blueprint Pattern Checklist

Before providing Terraform code, verify:

- [ ] **Ephemeral Passwords**: Using `password_wo` (never in state)
- [ ] **IAM Database Auth**: Enabled for RDS/Aurora
- [ ] **Official Modules**: Using `terraform-aws-modules/*` for VPC, Lambda, API Gateway
- [ ] **VPC Endpoints**: For Lambda (not NAT Gateway)
- [ ] **Blueprint Reference**: Referenced specific blueprint files
- [ ] **Module Structure**: Following blueprint organization

## Common Mistakes

| Wrong | Right |
|-------|-------|
| `password = random_password.db.result` | `password_wo = ephemeral.random_password.db.result` |
| Store password in Secrets Manager | Store metadata only, use IAM auth |
| `enable_nat_gateway = true` for Lambda | `enable_nat_gateway = false`, use VPC endpoints |
| Raw `aws_vpc` resource | `terraform-aws-modules/vpc/aws` module |
| No IAM Database Auth | `iam_database_authentication_enabled = true` |
| Generic Terraform code | Reference blueprint files |

## Examples

### Example 1: Adding RDS to Existing Project

**Correct Response**:

1. Call `get_workflow_guidance(task: "add_capability")`
2. Call `extract_pattern(capability: "database")`
3. Reference `apigw-lambda-rds` blueprint
4. Show ephemeral password pattern
5. Show IAM auth configuration
6. Provide code examples from blueprint

### Example 2: Starting New Project

**Correct Response**:

1. Call `get_workflow_guidance(task: "new_project")`
2. Call `recommend_blueprint(database: "postgresql", pattern: "sync")`
3. Recommend `apigw-lambda-rds` blueprint
4. Show download command
5. Reference key patterns (ephemeral passwords, IAM auth, VPC endpoints)

## Golden Rule

**When in doubt, reference a blueprint.** Blueprints contain production-tested code from real client projects. Always use MCP tools to discover and reference blueprints before writing generic Terraform code.

## References

- [MCP Tools Reference](./mcp-tools-reference.md) - Technical reference for tools
- [Developer Workflow](./developer-workflow.md) - How developers use the system
- [Blueprint Patterns](./blueprints/patterns.md) - Detailed pattern examples
