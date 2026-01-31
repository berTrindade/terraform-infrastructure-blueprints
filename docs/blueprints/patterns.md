# Key Patterns

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

Used in: `alb-ecs-fargate-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds`, `apigw-lambda-rds-proxy`

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

## Wrong vs Right: Adding Database Example

This example shows side-by-side comparisons of incorrect (generic) Terraform code versus correct (blueprint-pattern) code when adding a database to an existing project.

### Scenario

**User Request**: "I have an existing Terraform project with API Gateway and Lambda. I need to add RDS PostgreSQL."

### Wrong Approach: Generic Terraform

**Problems:**
1. **Password stored in Secrets Manager** - Password appears in Terraform state
2. **No IAM Database Authentication** - Uses password-based auth
3. **Raw VPC resources** - Manual VPC configuration instead of official module
4. **NAT Gateway for Lambda** - Expensive and unnecessary
5. **No blueprint reference** - Doesn't leverage existing patterns

```hcl
# WRONG: Generic Terraform without blueprint patterns

# Password stored in Secrets Manager (appears in state!)
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_string = random_password.db_password.result  # Password in state!
}

# Raw VPC resources (should use official module)
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# NAT Gateway (expensive for Lambda - should use VPC endpoints)
resource "aws_nat_gateway" "main" {
  # $32/month + data transfer
}

# RDS without IAM Database Authentication
resource "aws_db_instance" "main" {
  password = random_password.db_password.result  # Password-based auth
  # Missing iam_database_authentication_enabled = true
}
```

### Right Approach: Blueprint Pattern

**Benefits:**
1. **Ephemeral passwords** - Password never appears in Terraform state
2. **IAM Database Authentication** - More secure, no password management
3. **Official VPC module** - Battle-tested, well-maintained
4. **VPC endpoints** - Cost-effective for Lambda
5. **Blueprint reference** - Production-tested patterns from real projects

```hcl
# RIGHT: Blueprint pattern from apigw-lambda-rds

# Ephemeral password (Flow A) - NEVER in state
ephemeral "random_password" "db" {
  length  = 32
  special = false
}

# Official VPC module (not raw resources)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  
  enable_nat_gateway = false  # Lambda uses VPC endpoints
}

# VPC endpoints for Lambda (cost-effective)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type = "Interface"
}

# RDS with IAM Database Authentication
resource "aws_db_instance" "this" {
  # Flow A: Write-only password (never in state)
  password_wo         = ephemeral.random_password.db.result
  password_wo_version = 1
  
  # IAM Database Authentication enabled
  iam_database_authentication_enabled = true
}
```

### Key Differences

| Aspect | Wrong | Right |
|--------|-------|-------|
| **Password Storage** | Secrets Manager (in state) | Ephemeral `password_wo` (never in state) |
| **Authentication** | Password-based | IAM Database Authentication |
| **VPC** | Raw resources | Official `terraform-aws-modules/vpc/aws` |
| **Networking** | NAT Gateway ($32/month) | VPC Endpoints (pay per request) |
| **Blueprint Reference** | None | `apigw-lambda-rds` blueprint |

### How to Get the Right Code

1. **Use MCP Tool**: `extract_pattern(capability: "database")`
2. **Reference Blueprint Files**: Access via `fetch_blueprint_file()`
3. **Follow Patterns**: Ephemeral passwords, IAM auth, official modules, VPC endpoints

For more details, see [AI Assistant Guidelines](../ai-assistant-guidelines.md).
