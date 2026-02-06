---
name: style-guide
description: Use when selecting blueprints, naming resources, writing Terraform, or making architectural decisions. Includes decision tree, catalog, naming/tags, security, cost, and code quality by priority (CRITICAL, HIGH, MEDIUM, LOW).
---

# Infrastructure Style Guide

**Overview.** This skill is the single reference for blueprint-based infrastructure best practices. It consolidates catalog, decision trees, workflow guidance, and code patterns so AI assistants can prioritize recommendations by severity.

**When to use**
- Selecting or comparing blueprints (API vs async, database type, auth, containers)
- Writing or reviewing Terraform for blueprint-based infrastructure
- Making architectural decisions (serverless vs containers, DynamoDB vs RDS, etc.)
- Adding capabilities to existing projects (database, queue, auth, events)
- Checking security, cost, naming, or code-quality patterns

**When not to use**
- Generating code from templates → use `code-generation` skill
- Fetching blueprint file contents → use MCP `fetch_blueprint_file` instead
- Pure workflow steps (new project, add capability, migrate cloud) → use MCP `get_workflow_guidance` first; then use this skill for patterns and catalog

**Quick reference** (priority → topics)

| Priority | Topics |
|----------|--------|
| CRITICAL | Security: ephemeral passwords, IAM DB auth, security groups (least-privilege) |
| HIGH | Cost (VPC endpoints vs NAT), code quality (official modules, structure, naming) |
| MEDIUM | Architecture (VPC, extractable patterns, blueprint structure) |
| LOW | Monitoring, advanced patterns |

**Reference:** [Blueprint Catalog](docs/blueprints/catalog.md), [Patterns](docs/blueprints/patterns.md)

## CRITICAL Priority Rules

**Must fix immediately** - Security vulnerabilities, data exposure, critical performance issues.

### Security Patterns

*For full detail and when-to-use (secrets, security groups), use the `security` skill.*

#### Ephemeral Passwords (Flow A)

**Never store passwords in Terraform state.** Use ephemeral passwords with `password_wo` attribute:

```hcl
# WRONG: Password stored in state
resource "aws_secretsmanager_secret_version" "db" {
  secret_string = random_password.db.result  # Password in state!
}

# RIGHT: Ephemeral password (never in state)
ephemeral "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_instance" "main" {
  password_wo         = ephemeral.random_password.db_password.result
  password_wo_version = 1
  # Password NEVER in terraform.tfstate
}
```

**Used in**: `alb-ecs-fargate-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds`, `apigw-lambda-rds-proxy`

**Why**: Passwords never stored in Terraform state, improving security posture.

#### IAM Database Authentication

**Always enable IAM Database Authentication** for RDS/Aurora:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  # Applications use IAM tokens, not passwords
}
```

**Why**: Applications authenticate using IAM roles, eliminating password management.

#### Security Groups (Least-Privilege Access)

**Always configure security groups with least-privilege access:**

```hcl
resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "Allow Lambda to connect to RDS"
}
```

**Why**: Minimize attack surface by only allowing necessary connections.

## HIGH Priority Rules

**Important for production** - Cost optimization, performance, maintainability.

### Cost Optimization

#### VPC Endpoints vs NAT Gateway

**For Lambda**: Use VPC endpoints (cost-effective):

```hcl
# WRONG: Expensive NAT Gateway for Lambda
module "vpc" {
  enable_nat_gateway = true  # $32/month + data transfer
}

# RIGHT: Cost-effective VPC endpoints
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

**Why**: VPC endpoints are more cost-effective for Lambda functions than NAT Gateways ($32/month vs pay-per-request).

### Code Quality

#### Official Terraform Modules

**Use official modules** instead of raw resources:

```hcl
# WRONG: Raw VPC resources
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# RIGHT: Official module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  # ...
}
```

**Why**: Official modules are battle-tested, well-maintained, and follow best practices.

#### Module Structure

**Organize code into modules:**

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

**Why**: Modular structure makes code reusable and easier to maintain.

#### Naming Convention

**All resources follow `{project}-{environment}-{component}` pattern:**

```hcl
module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

# module.naming.prefix → "myapp-dev"
# Resource: "${module.naming.prefix}-api" → "myapp-dev-api"
# Resource: "${module.naming.prefix}-db"   → "myapp-dev-db"
```

Examples: prefix `myapp-dev` → `myapp-dev-api`, `myapp-dev-db`; DB subnet group `myapp-dev-db-subnets`; security group suffix `myapp-dev-api-sg`.

**Tags** — Apply at least:

| Tag | Purpose | Example |
|-----|---------|---------|
| **Environment** | Environment name | `dev`, `staging`, `prod` |
| **ManagedBy** | IaC tool | `terraform` |
| **Name** | Human-readable name | Same as or derived from `{project}-{env}-{component}` |

Use the blueprint `modules/tagging` (or equivalent) for consistency. Resource examples: RDS `myapp-dev-db`, DB subnet group `myapp-dev-db-subnets`, Lambda `myapp-dev-api`, security groups `myapp-dev-api-sg`, `myapp-dev-db-sg`.

**Why**: Consistent naming and tags make resources easier to identify and manage across environments.

## MEDIUM Priority Rules

**Recommended best practices** - Architecture patterns, extractable capabilities.

### Architecture Patterns

#### VPC Integration

**Blueprints with databases include VPC configuration:**

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

#### Extractable Patterns by Capability

**When adding capabilities to existing projects, extract these modules:**

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

#### Blueprint Structure

**Every blueprint follows this pattern:**

```
blueprints/aws/{blueprint-name}/
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
│   ├── networking/          # VPC, subnets, security groups
│   ├── naming/               # Naming conventions
│   └── tagging/              # Resource tags
├── src/                      # Application code (if any)
├── tests/                    # Terraform tests
└── README.md                 # Blueprint-specific docs
```

## LOW Priority Rules

**Optional optimizations** - Advanced features, monitoring patterns.

### Advanced Features

#### Monitoring Patterns

**Add CloudWatch alarms and dashboards for production:**

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${module.naming.prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert when Lambda errors occur"
}
```

#### Advanced Patterns

**Consider advanced patterns for specific use cases:**

- Multi-region deployments
- Blue-green deployments
- Canary releases
- Advanced monitoring and alerting

## Blueprint Catalog

Complete reference for all available blueprints, cross-cloud equivalents, and decision trees.

### Blueprint Catalog

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
| `functions-postgresql` | Serverless API with PostgreSQL | PostgreSQL Flexible Server | Sync | Azure serverless, relational data | HM Impuls - WhatsApp-based pitch submission platform (ustwo, 2025) |
| `appengine-cloudsql-strapi` | Containerized app with Cloud SQL | Cloud SQL PostgreSQL | Sync | GCP serverless, CMS/Strapi | Mavie iOS - Mobile app backend with Strapi CMS (ustwo, 2025) |

### Cross-Cloud Equivalents

When you need the same infrastructure pattern on a different cloud provider, use the `find_by_project` MCP tool with the `target_cloud` parameter.

#### Containerized Application with PostgreSQL

| GCP Blueprint | AWS Equivalent | Azure Equivalent | Notes |
|---------------|----------------|------------------|-------|
| `appengine-cloudsql-strapi` | `alb-ecs-fargate-rds` | `functions-postgresql` | Containerized app → ECS Fargate (AWS) or Functions (Azure). Note: Azure Functions is serverless, not containers. |

#### Serverless API with PostgreSQL

| Azure Blueprint | AWS Equivalent | GCP Equivalent | Notes |
|-----------------|----------------|----------------|-------|
| `functions-postgresql` | `apigw-lambda-rds` | `appengine-cloudsql-strapi` | Serverless Functions → Lambda (AWS) or App Engine (GCP) |

#### Project-Based Queries

You can find blueprints by project name and get cross-cloud equivalents:

**Example**: "I need what was done for Mavie but for AWS"
- Mavie uses: `appengine-cloudsql-strapi` (GCP)
- AWS equivalent: `alb-ecs-fargate-rds`

**Usage**: Use the `find_by_project` MCP tool:
```typescript
find_by_project({
  project_name: "Mavie",
  target_cloud: "aws"
})
```

### Decision Tree

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

## Workflow Guidance

### Overview

This skill ensures AI assistants reference production-tested infrastructure blueprint patterns instead of generating generic Terraform code. Blueprints contain battle-tested patterns from real client projects and follow best practices for security, cost optimization, and maintainability.

### When to Use

- Writing Terraform code for infrastructure
- Adding capabilities to existing infrastructure (database, queue, auth, etc.)
- Making architectural decisions (serverless vs containers, DynamoDB vs RDS, etc.)
- Starting new infrastructure projects
- Extracting patterns from blueprints for existing projects

### Core Principle

**Always check for blueprints first** - Before writing Terraform code, search for existing blueprint patterns that solve the same problem. Blueprints contain production-tested code from real client projects.

### Pre-Flight Checklist

Before writing any Terraform code, check:

- [ ] Are MCP tools available? (Look for `mcp_ustwo-infra_*` tools)
- [ ] Have I checked Skills for static content? (`style-guide`)
- [ ] Have I called `get_workflow_guidance()` to understand the correct workflow?
- [ ] Have I called `recommend_blueprint()` for new projects?
- [ ] Have I called `extract_pattern()` for adding capabilities?
- [ ] Am I referencing blueprint files before writing code?

### Workflow Guidance

#### Step 1: Determine the Scenario

Identify which scenario applies:

1. **New Project** - Starting infrastructure from scratch
2. **Add Capability** - Adding features to existing Terraform
3. **Migrate Cloud** - Moving between AWS/Azure/GCP
4. **Compare Options** - Making architectural decisions

#### Step 2: Use MCP Tools

**ALWAYS call `get_workflow_guidance()` FIRST** to understand the correct workflow:

```typescript
// For new projects
get_workflow_guidance(task: "new_project")

// For adding capabilities
get_workflow_guidance(task: "add_capability")

// For cloud migrations
get_workflow_guidance(task: "migrate_cloud")
```

#### Step 3: Discover Blueprints

**For static content (catalog, patterns)**: Reference this Skill for instant access.

**For dynamic discovery**: Use MCP tools to find relevant blueprints:
- **`recommend_blueprint()`** - Get blueprint recommendation based on requirements
- **`search_blueprints()`** - Search for blueprints by keywords
- **`extract_pattern()`** - Get guidance on extracting specific capabilities
- **`find_by_project()`** - Find blueprints used by specific projects

#### Step 4: Generate or Reference Code

**For adding capabilities to existing projects**: Use `code-generation` skill to generate code locally:
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
- **"Add capability"** → Use `code-generation` skill
- **"How does X work?"** or **"Study blueprint"** → Use `fetch_blueprint_file()` MCP tool

#### Step 5: Follow Blueprint Patterns

**Reference this skill** for detailed pattern documentation. Key patterns are organized by priority above.

### Common Scenarios

#### Scenario 1: Adding RDS to Existing Project

**User says**: "I need to add RDS PostgreSQL to my existing Lambda API"

**AI should**:
1. Call `get_workflow_guidance(task: "add_capability")`
2. Call `extract_pattern(capability: "database")`
3. **Use `code-generation` skill** to generate RDS module code:
   - Extract parameters from project history (naming, VPC, security groups)
   - Build JSON payload with blueprint, snippet, and params
   - Execute template generator script
   - Return generated Terraform code (already adapted to conventions)
4. Show ephemeral password pattern (CRITICAL)
5. Show IAM database authentication (CRITICAL)
6. Adapt generated code to existing project if needed

#### Scenario 2: Starting New Project

**User says**: "I need a serverless API with PostgreSQL"

**AI should**:
1. Call `get_workflow_guidance(task: "new_project")`
2. Call `recommend_blueprint(database: "postgresql", pattern: "sync")`
3. Recommend `apigw-lambda-rds` blueprint
4. Provide download instructions
5. Reference key patterns from blueprint (prioritize CRITICAL and HIGH)

#### Scenario 3: Architectural Decision

**User says**: "Should I use DynamoDB or RDS?"

**AI should**:
1. Call `get_workflow_guidance(task: "general")`
2. Compare blueprints: `apigw-lambda-dynamodb` vs `apigw-lambda-rds`
3. Explain trade-offs
4. Recommend based on use case

### Standalone Code Requirement

**Critical**: All code provided must be standalone with zero dependencies on the blueprint repository.

- ✅ Copy module code directly
- ✅ Include all necessary variables and outputs
- ✅ Adapt to existing project conventions
- ❌ No references to blueprint repository
- ❌ No external dependencies on ustwo systems

### Workflow: Skills vs MCP Tools

**Skills (Static Content)** - Instant access, no network calls:
- `style-guide`: This consolidated skill (catalog, patterns, workflows)
- `code-generation`: Generate code from templates (for adding capabilities)

**MCP Tools (Dynamic Discovery)** - For interactive workflows:
- `recommend_blueprint()`: Get recommendations based on requirements
- `search_blueprints()`: Search for blueprints by keywords
- `extract_pattern()`: Get extraction guidance for capabilities
- `find_by_project()`: Find blueprints by project name
- `fetch_blueprint_file()`: Get specific files on-demand during discovery
- `get_workflow_guidance()`: Get step-by-step workflow guidance

### Checklist

Before providing Terraform code:

- [ ] Called `get_workflow_guidance()` to understand workflow
- [ ] Used MCP tools to discover relevant blueprints
- [ ] Referenced specific blueprint files
- [ ] Followed CRITICAL priority patterns (ephemeral passwords, IAM auth, security groups)
- [ ] Followed HIGH priority patterns (VPC endpoints, official modules, naming)
- [ ] Code is standalone (no blueprint repository dependencies)
- [ ] Adapted to existing project conventions (if applicable)

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

- User asks "What blueprints are available?"
- User needs help selecting a blueprint
- User wants to compare options (DynamoDB vs RDS, serverless vs containers)
- User needs cross-cloud equivalents
- User asks about decision trees or blueprint structure
- User asks about database password management
- User needs VPC configuration guidance
- User asks about naming conventions
- User wants to add capabilities to existing infrastructure
- User needs pattern examples for specific scenarios
- User is writing Terraform code for infrastructure
- User is making architectural decisions

## MCP Tools for Discovery

For dynamic discovery and recommendations, use MCP tools:

- `recommend_blueprint()` - Get blueprint recommendation based on requirements
- `search_blueprints()` - Search for blueprints by keywords
- `find_by_project()` - Find blueprints used by specific projects
- `fetch_blueprint_file()` - Get specific blueprint files on-demand
- `extract_pattern()` - Get guidance on extracting specific capabilities
- `get_workflow_guidance()` - Get step-by-step workflow guidance

## References

- **MCP Server**: Configured separately - provides blueprint discovery tools
- **Blueprint Repository**: https://github.com/berTrindade/terraform-infrastructure-blueprints
- **AI Guidelines**: See `docs/ai-assistant-guidelines.md` in blueprint repository
- **Pattern Examples**: See `docs/blueprints/patterns.md` (includes wrong vs right examples)
