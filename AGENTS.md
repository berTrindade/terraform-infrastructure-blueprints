# Terraform Infrastructure Blueprints - AI Assistant Guide

> This file provides context for AI assistants to help developers use ustwo's infrastructure blueprints.

## What This Repository Is

Opinionated, standalone Infrastructure-as-Code blueprints for AWS, Azure, and GCP. Each blueprint is a complete, self-contained package you can copy and own - no dependencies, no vendor lock-in.

**Key principle**: Copy one blueprint folder and you have everything needed.

**Consultancy model**: ustwo builds for clients. When engagements end, clients own the code. Generated Terraform must be completely standalone with zero ustwo dependencies.

## Supported Scenarios

This repository supports two core consultant scenarios. Understanding which scenario applies helps provide the right guidance.

### Scenario 1: App Exists, Need Infrastructure

**User says**: "I have a fullstack app running locally (React + Node.js + PostgreSQL). I need to deploy it to AWS."

**Or hybrid cases**: "I need AWS infrastructure (Lambda, Dynamo, API Gateway) but I also want a Strapi instance (which presumably involves EC2 or Fargate and a bunch of other supporting AWS infrastructure, with a Strapi image in the middle of it)."

**AI should**:
1. Ask about the tech stack and whether they want to containerize or go serverless
2. **For single-pattern needs**: Recommend `alb-ecs-fargate-rds` (containerize as-is) or `apigw-lambda-rds` (refactor to serverless)
3. **For hybrid/composite needs**: Identify multiple infrastructure patterns required and recommend combining blueprints (e.g., serverless API + containerized CMS)
4. Provide tiged command(s) to download the blueprint(s)
5. Guide through configuration and deployment (or combining patterns if multiple blueprints)

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
| Containerized CMS/App | `alb-ecs-fargate-rds` or `alb-ecs-fargate` | `modules/compute/`, `modules/networking/`, `modules/data/` (if database needed) |

## Blueprint Catalog

| Blueprint | Description | Database | API Pattern | Use When | Origin |
|-----------|-------------|----------|-------------|----------|--------|
| `apigw-lambda-dynamodb` | Serverless REST API | DynamoDB | Sync | Simple CRUD, NoSQL, lowest cost | TBD |
| `apigw-lambda-dynamodb-cognito` | Serverless API + Auth | DynamoDB | Sync | Need user authentication | TBD |
| `apigw-lambda-rds` | Serverless REST API | PostgreSQL | Sync | Relational data, SQL queries | NBCU Loyalty Build (Backlot) - Web app for fan loyalty & quest rewards (ustwo, 2025) |
| `apigw-lambda-rds-proxy` | Serverless API + Connection Pooling | PostgreSQL | Sync | High-traffic production with RDS | TBD |
| `apigw-lambda-aurora` | Serverless API + Aurora | Aurora Serverless | Sync | Variable/unpredictable traffic | TBD |
| `appsync-lambda-aurora-cognito` | GraphQL API + Auth + Aurora | Aurora Serverless | Sync | GraphQL, user auth, relational data | The Body Coach (ustwo, 2020) |
| `apigw-sqs-lambda-dynamodb` | Async Queue Worker | DynamoDB | Async | Background jobs, decoupled processing | SuprDOG/FetchIQ - Pet health platform with AI-powered lab analysis and product recommendations (ustwo, 2025) |
| `apigw-eventbridge-lambda` | Event-driven Fanout | N/A | Async | Multiple consumers, event routing | TBD |
| `apigw-sns-lambda` | Pub/Sub Pattern | N/A | Async | Notify multiple systems | TBD |
| `alb-ecs-fargate` | Containerized API | N/A | Sync | Custom runtime, containers | Sproufiful - AI meal planning app (ustwo, 2024), Samsung Maestro - AI collaboration tool (ustwo, 2025) |
| `alb-ecs-fargate-rds` | Containerized API + RDS | PostgreSQL | Sync | Containers with relational data | TBD |
| `eks-cluster` | Kubernetes Cluster | N/A | N/A | Container orchestration at scale | TBD |
| `eks-argocd` | EKS + GitOps | N/A | N/A | GitOps deployment workflow | RVO QuitBuddy - AI-powered smoking cessation platform with event-driven architecture (ustwo, 2025) |
| `apigw-lambda-bedrock-rag` | RAG API with Bedrock | OpenSearch | Sync | AI/ML, document Q&A | Cancer Platform (Backend) - RAG API for document Q&A (ustwo, 2025) |
| `amplify-cognito-apigw-lambda` | Full-stack with Auth | DynamoDB | Sync | Frontend + backend + auth | Cancer Platform (Frontend) - Next.js app for document management (ustwo, 2024) |
| `azure-functions-postgresql` | Serverless API with PostgreSQL | PostgreSQL Flexible Server | Sync | Azure serverless, relational data | HM Impuls - WhatsApp-based pitch submission platform (ustwo, 2025) |
| `gcp-appengine-cloudsql-strapi` | Containerized app with Cloud SQL | Cloud SQL PostgreSQL | Sync | GCP serverless, CMS/Strapi | Mavie iOS - Mobile app backend with Strapi CMS (ustwo, 2025) |

## Cross-Cloud Equivalents

When you need the same infrastructure pattern on a different cloud provider, use the `find_by_project` tool with the `target_cloud` parameter.

### Containerized Application with PostgreSQL

| GCP Blueprint | AWS Equivalent | Azure Equivalent | Notes |
|---------------|----------------|------------------|-------|
| `gcp-appengine-cloudsql-strapi` | `alb-ecs-fargate-rds` | `azure-functions-postgresql` | Containerized app → ECS Fargate (AWS) or Functions (Azure). Note: Azure Functions is serverless, not containers. |

### Serverless API with PostgreSQL

| Azure Blueprint | AWS Equivalent | GCP Equivalent | Notes |
|-----------------|----------------|----------------|-------|
| `azure-functions-postgresql` | `apigw-lambda-rds` | `gcp-appengine-cloudsql-strapi` | Serverless Functions → Lambda (AWS) or App Engine (GCP) |

### Project-Based Queries

You can find blueprints by project name and get cross-cloud equivalents:

**Example**: "I need what was done for Mavie but for AWS"
- Mavie uses: `gcp-appengine-cloudsql-strapi` (GCP)
- AWS equivalent: `alb-ecs-fargate-rds`

**Usage**: Use the `find_by_project` tool:
```typescript
find_by_project({
  project_name: "Mavie",
  target_cloud: "aws"
})
```

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
│   ├── Need GraphQL?
│   │   └── Yes → appsync-lambda-aurora-cognito
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

## Workflow: Combining Multiple Blueprints

**User says**: "I need AWS infrastructure (Lambda, Dynamo, API Gateway) but I also want a Strapi instance (which presumably involves EC2 or Fargate and a bunch of other supporting AWS infrastructure, with a Strapi image in the middle of it)."

**AI should**:

1. **Recognize hybrid needs**: Identify that user needs multiple infrastructure patterns combined
   - Example: Serverless API (Lambda/DynamoDB/API Gateway) + Containerized CMS (Strapi on ECS Fargate)

2. **Identify component blueprints**: Map each component to appropriate blueprint(s)
   - Serverless API → `apigw-lambda-dynamodb`
   - Containerized CMS → `alb-ecs-fargate-rds` (if database needed) or `alb-ecs-fargate`

3. **Choose approach**:
   - **Option A: Copy both blueprints and merge** (for new projects)
     - Download both blueprints to separate directories
     - Merge modules into single project structure
     - Consolidate shared resources (VPC, networking, naming)
   - **Option B: Extract modules from both blueprints** (for existing projects)
     - Extract relevant modules from each blueprint
     - Integrate into existing project structure
     - Adapt to existing conventions

4. **Handle shared infrastructure**:
   - **Single VPC**: Use one VPC module shared across both patterns
   - **Unified naming**: Ensure consistent naming conventions across components
   - **Shared security groups**: Reuse security groups where appropriate (e.g., database access)
   - **Consolidated outputs**: Merge outputs from both patterns

5. **Provide step-by-step guidance**:
   ```bash
   # Download both blueprints
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-dynamodb ./infra-api
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/alb-ecs-fargate-rds ./infra-cms
   
   # Merge into single project structure
   # - Combine modules/ directories
   # - Merge environments/dev/main.tf
   # - Consolidate VPC/networking modules
   # - Unify naming and tagging
   ```

6. **Specific Strapi guidance**:
   - Use `alb-ecs-fargate-rds` for Strapi (Strapi typically needs PostgreSQL)
   - Extract ECS Fargate modules from `alb-ecs-fargate-rds`
   - Extract API Gateway/Lambda modules from `apigw-lambda-dynamodb`
   - Share VPC and networking between both components
   - Ensure security groups allow Lambda → DynamoDB and ECS → RDS connections
   - Use unified naming: `{project}-{env}-{component}` (e.g., `myapp-dev-api`, `myapp-dev-cms`)

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
