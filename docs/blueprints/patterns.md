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
