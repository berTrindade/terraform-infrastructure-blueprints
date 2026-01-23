# Terraform Infrastructure Blueprints - AI Assistant Guide

> This file provides context for AI assistants to help developers use ustwo's infrastructure blueprints.

## What This Repository Is

Opinionated, standalone Infrastructure-as-Code blueprints for AWS. Each blueprint is a complete, self-contained package you can copy and own - no dependencies, no vendor lock-in.

**Key principle**: Copy one blueprint folder and you have everything needed.

**Consultancy model**: ustwo builds for clients. When engagements end, clients own the code. Generated Terraform must be completely standalone with zero ustwo dependencies.

## Supported Scenarios

This repository supports two core consultant scenarios. Understanding which scenario applies helps provide the right guidance.

### Scenario 1: App Exists, Need Infrastructure

**User says**: "I have a fullstack app running locally (React + Node.js + PostgreSQL). I need to deploy it to AWS."

**AI should**:
1. Ask about the tech stack and whether they want to containerize or go serverless
2. Recommend `alb-ecs-fargate-rds` (containerize as-is) or `apigw-lambda-rds` (refactor to serverless)
3. Provide tiged command to download the blueprint
4. Guide through configuration and deployment

### Scenario 2: Existing Terraform, Add Capability

**User says**: "I have an existing Terraform project with API Gateway and Lambda. I need to add SQS for background processing."

**AI should**:
1. Ask about existing infrastructure (VPC, naming conventions, etc.)
2. Identify relevant blueprint: `apigw-sqs-lambda-dynamodb`
3. Extract the relevant modules (`modules/queue/`, `modules/worker/`)
4. Adapt code to fit existing project conventions
5. Provide standalone Terraform that integrates with their existing setup

**Extractable patterns by capability**:
| Capability | Source Blueprint | Modules to Extract |
|------------|------------------|-------------------|
| Database (RDS) | `apigw-lambda-rds` | `modules/data/`, `modules/networking/` |
| Queue (SQS) | `apigw-sqs-lambda-dynamodb` | `modules/queue/`, `modules/worker/` |
| Auth (Cognito) | `apigw-lambda-dynamodb-cognito` | `modules/auth/` |
| Events (EventBridge) | `apigw-eventbridge-lambda` | `modules/events/` |
| AI/RAG (Bedrock) | `apigw-lambda-bedrock-rag` | `modules/ai/`, `modules/vectorstore/` |

## Blueprint Catalog

| Blueprint | Description | Database | API Pattern | Use When |
|-----------|-------------|----------|-------------|----------|
| `apigw-lambda-dynamodb` | Serverless REST API | DynamoDB | Sync | Simple CRUD, NoSQL, lowest cost |
| `apigw-lambda-dynamodb-cognito` | Serverless API + Auth | DynamoDB | Sync | Need user authentication |
| `apigw-lambda-rds` | Serverless REST API | PostgreSQL | Sync | Relational data, SQL queries |
| `apigw-lambda-rds-proxy` | Serverless API + Connection Pooling | PostgreSQL | Sync | High-traffic production with RDS |
| `apigw-lambda-aurora` | Serverless API + Aurora | Aurora Serverless | Sync | Variable/unpredictable traffic |
| `apigw-sqs-lambda-dynamodb` | Async Queue Worker | DynamoDB | Async | Background jobs, decoupled processing |
| `apigw-eventbridge-lambda` | Event-driven Fanout | N/A | Async | Multiple consumers, event routing |
| `apigw-sns-lambda` | Pub/Sub Pattern | N/A | Async | Notify multiple systems |
| `alb-ecs-fargate` | Containerized API | N/A | Sync | Custom runtime, containers |
| `alb-ecs-fargate-rds` | Containerized API + RDS | PostgreSQL | Sync | Containers with relational data |
| `eks-cluster` | Kubernetes Cluster | N/A | N/A | Container orchestration at scale |
| `eks-argocd` | EKS + GitOps | N/A | N/A | GitOps deployment workflow |
| `apigw-lambda-bedrock-rag` | RAG API with Bedrock | OpenSearch | Sync | AI/ML, document Q&A |
| `amplify-cognito-apigw-lambda` | Full-stack with Auth | DynamoDB | Sync | Frontend + backend + auth |

## Decision Tree

```
What do you need?
├── API (request/response)
│   ├── Need authentication?
│   │   ├── Yes → apigw-lambda-dynamodb-cognito or amplify-cognito-apigw-lambda
│   │   └── No → Continue...
│   ├── Database type?
│   │   ├── NoSQL (DynamoDB)
│   │   │   └── apigw-lambda-dynamodb
│   │   ├── SQL (PostgreSQL)
│   │   │   ├── High traffic? → apigw-lambda-rds-proxy
│   │   │   ├── Variable traffic? → apigw-lambda-aurora
│   │   │   └── Standard → apigw-lambda-rds
│   │   └── None → apigw-lambda-dynamodb (simplest)
│   └── Need containers?
│       ├── With database → alb-ecs-fargate-rds
│       └── Without → alb-ecs-fargate
├── Async/Background Processing
│   ├── Queue-based worker → apigw-sqs-lambda-dynamodb
│   ├── Event fanout (multiple consumers) → apigw-eventbridge-lambda
│   └── Pub/sub notifications → apigw-sns-lambda
├── Kubernetes
│   ├── With GitOps → eks-argocd
│   └── Standard → eks-cluster
└── AI/ML
    └── RAG/Document Q&A → apigw-lambda-bedrock-rag
```

## Blueprint Structure

Every blueprint follows this pattern:

```
aws/{blueprint-name}/
├── environments/
│   └── dev/
│       ├── main.tf           # Module composition
│       ├── variables.tf      # Input variables  
│       ├── outputs.tf        # Outputs
│       ├── versions.tf       # Provider versions
│       ├── terraform.tfvars  # Default values
│       └── backend.tf.example
├── modules/                  # Self-contained modules
│   ├── api/                  # API Gateway configuration
│   ├── compute/              # Lambda or ECS
│   ├── data/                 # Database (DynamoDB, RDS, etc.)
│   ├── networking/           # VPC, subnets, security groups
│   ├── naming/               # Naming conventions
│   └── tagging/              # Resource tags
├── src/                      # Application code (if any)
├── tests/                    # Terraform tests
└── README.md                 # Blueprint-specific docs
```

## Key Patterns

### Secrets Management (Flow A - Database Passwords)

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

### Naming Convention

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

### VPC Integration

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

## Workflow: Adding a Resource to an Existing Project

**User says**: "I need to add RDS to my existing Terraform project"

**AI should**:

1. **Ask discovery questions**:
   - "What AWS region is your project in?"
   - "Do you have an existing VPC? If so, what are the VPC ID and private subnet IDs?"
   - "What's your naming convention (e.g., `project-env-component`)?"
   - "Do you need the ephemeral secrets pattern for credentials?"
   - "Which resources need database access (e.g., Lambda, ECS)?"

2. **Identify relevant modules** from blueprints:
   - `modules/data/` - RDS instance configuration
   - `modules/networking/` or security group rules
   - Secrets Manager for connection metadata

3. **Extract and adapt code**:
   - Copy relevant module code from `apigw-lambda-rds/modules/data/`
   - Adapt variables to match existing project's VPC, naming, etc.
   - Ensure security groups allow access from compute resources

4. **Provide standalone Terraform**:
   - Code must work without any reference to this blueprints repo
   - Include all necessary variables and outputs
   - Follow the project's existing conventions

## Workflow: Starting a New Project from Blueprint

**User says**: "I'm starting a new project and need a serverless API with PostgreSQL"

**AI should**:

1. **Ask discovery questions**:
   - "What type of database? (DynamoDB / PostgreSQL / Aurora)"
   - "Do you need authentication (Cognito)?"
   - "Sync API or async processing (queues)?"
   - "Expected traffic level? (affects RDS vs RDS Proxy choice)"
   - "Project name and AWS region?"

2. **Recommend blueprint**:
   - Based on answers, suggest the matching blueprint from the catalog
   - Explain why it fits their needs

3. **Provide setup instructions**:
   ```bash
   # Download the blueprint
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-rds ./infra
   
   # Navigate and configure
   cd infra/environments/dev
   
   # Edit terraform.tfvars with project name and region
   # Configure AWS credentials
   
   # Deploy
   terraform init
   terraform plan
   terraform apply
   ```

4. **Offer customization help**:
   - Adjust instance sizes
   - Add additional environments (staging, prod)
   - Customize security groups
   - Add monitoring/alerting

## Common Customizations

| Customization | Where to Change | Example |
|---------------|-----------------|---------|
| AWS Region | `terraform.tfvars` | `aws_region = "eu-west-1"` |
| Project Name | `terraform.tfvars` | `project = "client-api"` |
| Database Size | `terraform.tfvars` | `db_instance_class = "db.t3.medium"` |
| Lambda Memory | `terraform.tfvars` | `lambda_memory_size = 512` |
| VPC CIDR | `modules/vpc/variables.tf` | `cidr_block = "10.1.0.0/16"` |
| Tags | `modules/tagging/main.tf` | Add custom tags |

## Quick Reference Commands

```bash
# Download a blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/{blueprint-name} ./infra

# Initialize and deploy
cd infra/environments/dev
terraform init
terraform plan
terraform apply

# Get outputs (API endpoint, etc.)
terraform output

# Run tests
terraform test

# Cleanup
terraform destroy
```

## Important Constraints

1. **Client ownership**: Generated code must be fully standalone
2. **No ustwo dependencies**: Zero references to ustwo repos or packages
3. **Self-contained modules**: All modules included in the blueprint folder
4. **Official AWS modules**: Use terraform-aws-modules where appropriate
5. **Terraform 1.11+**: Required for ephemeral values and write-only attributes
