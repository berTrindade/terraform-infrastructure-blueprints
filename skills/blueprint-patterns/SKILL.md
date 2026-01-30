---
name: blueprint-patterns
description: Common infrastructure patterns from blueprints (ephemeral passwords, IAM auth, VPC, naming). Use when writing Terraform code or adding capabilities to existing infrastructure.
---

# Blueprint Patterns

Common patterns used across blueprints for secrets management, naming conventions, VPC integration, and extractable capabilities.

## Secrets Management (Flow A - Database Passwords)

Blueprints use ephemeral passwords that never appear in Terraform state:

```hcl
# Password generated ephemerally, sent via write-only attribute
ephemeral "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_instance" "main" {
  password_wo         = ephemeral.random_password.db_password.result
  password_wo_version = 1
}
```

**Used in**: `alb-ecs-fargate-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds`, `apigw-lambda-rds-proxy`

**Why**: Passwords never stored in Terraform state, improving security posture.

## IAM Database Authentication

Always enable IAM Database Authentication for RDS/Aurora:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  # Applications use IAM tokens, not passwords
}
```

**Why**: Applications authenticate using IAM roles, eliminating password management.

## Naming Convention

All resources follow `{project}-{environment}-{component}` pattern:

```hcl
module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

# Usage: module.naming.prefix → "myapp-dev"
# Resource: "${module.naming.prefix}-api" → "myapp-dev-api"
```

**Why**: Consistent naming makes resources easier to identify and manage.

## VPC Integration

Blueprints with databases include VPC configuration:

```hcl
module "vpc" {
  source = "../../modules/vpc"
  
  project     = var.project
  environment = var.environment
  
  # Creates: VPC, public/private subnets, NAT gateway, route tables
}

# Lambda/ECS connects via private subnets
# Database in isolated subnets (no internet access)
```

### VPC Endpoints vs NAT Gateway

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

**Why**: VPC endpoints are more cost-effective for Lambda functions than NAT Gateways.

## Official Terraform Modules

Use official modules instead of raw resources:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  # ...
}
```

**Why**: Official modules are battle-tested, well-maintained, and follow best practices.

## Module Structure

Organize code into modules:

```hcl
# environments/dev/main.tf - composition only
module "data" {
  source = "../../modules/data"
}

module "api_lambda" {
  source = "../../modules/compute"
}
```

**Why**: Modular structure makes code reusable and easier to maintain.

## Extractable Patterns by Capability

When adding capabilities to existing projects, extract these modules:

| Capability | Source Blueprint | Modules to Extract |
|------------|------------------|-------------------|
| Database (RDS) | `apigw-lambda-rds` | `modules/data/`, `modules/networking/` |
| Queue (SQS) | `apigw-sqs-lambda-dynamodb` | `modules/queue/`, `modules/worker/` |
| Auth (Cognito) | `apigw-lambda-dynamodb-cognito` | `modules/auth/` |
| Events (EventBridge) | `apigw-eventbridge-lambda` | `modules/events/` |
| AI/RAG (Bedrock) | `apigw-lambda-bedrock-rag` | `modules/ai/`, `modules/vectorstore/` |
| Containerized CMS/App | `alb-ecs-fargate-rds` or `alb-ecs-fargate` | `modules/compute/`, `modules/networking/`, `modules/data/` (if database needed) |

**Usage**: Use the `extract_pattern` MCP tool for detailed extraction guidance:
```typescript
extract_pattern({
  capability: "database",
  include_code_examples: true
})
```

## Common Anti-Patterns to Avoid

### ❌ Storing Passwords in Secrets Manager

```hcl
# WRONG: Password stored in state
resource "aws_secretsmanager_secret_version" "db" {
  secret_string = random_password.db.result  # Password in state!
}
```

### ✅ Use Ephemeral Passwords

```hcl
# RIGHT: Password never in state
ephemeral "random_password" "db" {
  length  = 32
  special = true
}

resource "aws_db_instance" "main" {
  password_wo         = ephemeral.random_password.db.result
  password_wo_version = 1
}
```

### ❌ Using NAT Gateway for Lambda

```hcl
# WRONG: Expensive NAT Gateway for Lambda
module "vpc" {
  enable_nat_gateway = true  # Unnecessary cost
}
```

### ✅ Use VPC Endpoints for Lambda

```hcl
# RIGHT: Cost-effective VPC endpoints
module "vpc" {
  enable_nat_gateway = false
}

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type = "Interface"
}
```

## When to Use This Skill

- User asks about database password management
- User needs VPC configuration guidance
- User asks about naming conventions
- User wants to add capabilities to existing infrastructure
- User needs pattern examples for specific scenarios

## Related Skills

- **blueprint-catalog**: Blueprint catalog and decision trees
- **blueprint-guidance**: Workflow guidance for using blueprints

## MCP Tools for Pattern Extraction

For extracting patterns from blueprints, use MCP tools:

- `extract_pattern()` - Get guidance on extracting specific capabilities
- `fetch_blueprint_file()` - Get specific blueprint files to reference patterns
- `get_workflow_guidance()` - Get step-by-step workflow guidance
