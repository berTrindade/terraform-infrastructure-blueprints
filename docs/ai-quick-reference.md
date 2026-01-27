# AI Assistant Quick Reference

One-page reference for AI assistants working with Terraform Infrastructure Blueprints.

## MCP Tools Quick Lookup

| Tool | When to Use | Example |
|------|-------------|---------|
| `extract_pattern(capability)` | Adding capability to existing project | `extract_pattern(capability: "database")` |
| `recommend_blueprint(...)` | Starting new project or recommendations | `recommend_blueprint(database: "postgresql", pattern: "sync")` |
| `find_by_project(project_name)` | Finding project blueprint or cross-cloud equivalent | `find_by_project(project_name: "Mavie", target_cloud: "aws")` |
| `compare_blueprints(comparison)` | Architectural decisions | `compare_blueprints(comparison: "dynamodb-vs-rds")` |
| `search_blueprints(query)` | Finding blueprints by keywords | `search_blueprints(query: "serverless postgresql")` |
| `get_blueprint_details(name)` | Getting detailed blueprint info | `get_blueprint_details(name: "apigw-lambda-rds")` |

## Common Scenarios

### Scenario 1: Adding Database to Existing Project

```
User: "I need to add RDS PostgreSQL to my existing Lambda API"

1. Call: extract_pattern(capability: "database")
2. Reference: apigw-lambda-rds blueprint
3. Extract: modules/data/, modules/secrets/, modules/networking/
4. Patterns: ephemeral password_wo, IAM auth, VPC endpoints
```

### Scenario 2: Starting New Project

```
User: "I need a serverless API with PostgreSQL"

1. Call: recommend_blueprint(database: "postgresql", pattern: "sync")
2. Recommend: apigw-lambda-rds
3. Show: Download command, key patterns, structure
```

### Scenario 3: Cross-Cloud Migration

```
User: "I need what was done for Mavie but for AWS"

1. Call: find_by_project(project_name: "Mavie", target_cloud: "aws")
2. Identify: Mavie uses gcp-appengine-cloudsql-strapi (GCP)
3. Recommend: alb-ecs-fargate-rds (AWS equivalent)
```

## Extractable Capabilities

| Capability | Source Blueprint | Modules |
|------------|------------------|---------|
| **Database** | `apigw-lambda-rds` | `modules/data/`, `modules/networking/` |
| **Queue** | `apigw-sqs-lambda-dynamodb` | `modules/queue/`, `modules/worker/` |
| **Auth** | `apigw-lambda-dynamodb-cognito` | `modules/auth/` |
| **Events** | `apigw-eventbridge-lambda` | `modules/events/` |
| **AI/RAG** | `apigw-lambda-bedrock-rag` | `modules/ai/`, `modules/vectorstore/` |
| **Notifications** | `apigw-sns-lambda` | `modules/notifications/` |

## Blueprint Pattern Checklist

Before providing Terraform code, verify:

- [ ] **Ephemeral Passwords**: Using `password_wo` (never in state)
- [ ] **IAM Database Auth**: Enabled for RDS/Aurora
- [ ] **Official Modules**: Using `terraform-aws-modules/*` for VPC, Lambda, API Gateway
- [ ] **VPC Endpoints**: For Lambda (not NAT Gateway)
- [ ] **Blueprint Reference**: Referenced specific blueprint files
- [ ] **Module Structure**: Following blueprint organization

## Key Patterns

### Ephemeral Password (Flow A)

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

### IAM Database Authentication

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

### Official VPC Module

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  enable_nat_gateway = false  # Lambda uses VPC endpoints
  # ...
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf:53-73`

### VPC Endpoints (Not NAT Gateway)

```hcl
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type = "Interface"
  subnet_ids        = module.vpc.private_subnets
}
```

**Reference**: `apigw-lambda-rds/environments/dev/main.tf:141-150`

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| `password = random_password.db.result` | `password_wo = ephemeral.random_password.db.result` |
| Store password in Secrets Manager | Store metadata only, use IAM auth |
| `enable_nat_gateway = true` for Lambda | `enable_nat_gateway = false`, use VPC endpoints |
| Raw `aws_vpc` resource | `terraform-aws-modules/vpc/aws` module |
| No IAM Database Auth | `iam_database_authentication_enabled = true` |
| Generic Terraform code | Reference blueprint files |

## Blueprint Decision Tree

```
Need infrastructure?
├── New project?
│   ├── Database? → recommend_blueprint(database: "...")
│   ├── Auth? → recommend_blueprint(auth: true)
│   └── Containers? → recommend_blueprint(containers: true)
├── Existing project?
│   ├── Add database → extract_pattern(capability: "database")
│   ├── Add queue → extract_pattern(capability: "queue")
│   └── Add auth → extract_pattern(capability: "auth")
└── Cross-cloud?
    └── find_by_project(project_name: "...", target_cloud: "...")
```

## MCP Resource URIs

Access blueprint files directly:

```
blueprints://aws/apigw-lambda-rds/README.md
blueprints://aws/apigw-lambda-rds/environments/dev/main.tf
blueprints://aws/apigw-lambda-rds/modules/data/main.tf
blueprints://aws/apigw-lambda-rds/modules/secrets/main.tf
```

## Quick Commands

### Download Blueprint

```bash
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/{blueprint-name} ./infra
```

### Deploy

```bash
cd infra/environments/dev
terraform init && terraform apply
```

## Related Documentation

- [AI Assistant Guidelines](ai-assistant-guidelines.md) - Comprehensive guide
- [Wrong vs Right Examples](examples/wrong-vs-right-database.md) - Code comparisons
- [Blueprint Catalog](blueprints/catalog.md) - All blueprints
- [Patterns](blueprints/patterns.md) - Key patterns
- [Workflows](blueprints/workflows.md) - Usage scenarios

## Golden Rule

**When in doubt, reference a blueprint.** Blueprints contain production-tested code from real client projects. Always use MCP tools to discover and reference blueprints before writing generic Terraform code.
