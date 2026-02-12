---
name: style-guide
description: Use when selecting blueprints, naming resources, writing Terraform, or making architectural decisions. Includes decision tree, catalog, naming/tags, security, cost, and code quality by priority (CRITICAL, HIGH, MEDIUM, LOW).
---

# Infrastructure Style Guide

## When to Use This Skill

Use `style-guide` for:

- Selecting the right blueprint (decision tree)
- Naming resources (`{project}-{env}-{resource}`)
- Writing or reviewing Terraform code
- Architectural decisions (containers vs serverless, Aurora vs RDS)

**DO NOT** use `style-guide` for:

- Code generation (use `code-generation`)
- Running tests (use `terraform-testing`)
- Finding blueprints (use MCP `search_blueprints`)

### Decision Workflow

1. **User asks architectural question** → Load catalog, apply priority rules (CRITICAL > HIGH > MEDIUM > LOW)
2. **User asks to write Terraform** → Load patterns, apply naming/tagging conventions
3. **User asks about blueprint** → First check catalog (instant), then MCP for files

---

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

**Reference:** [Blueprint Catalog](docs/blueprints/catalog.md), [Patterns](docs/blueprints/patterns.md), [Workflow Guidance](references/workflows.md)

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

#### HCL Code Formatting

**Follow HashiCorp's official Terraform style conventions** for consistent, readable code:

**Reference:** [HashiCorp Terraform Style Guide](https://developer.hashicorp.com/terraform/language/style)

##### File Organization

| File | Purpose |
|------|---------|
| `terraform.tf` | Terraform and provider version requirements |
| `providers.tf` | Provider configurations |
| `main.tf` | Primary resources and data sources |
| `variables.tf` | Input variable declarations (alphabetical) |
| `outputs.tf` | Output value declarations (alphabetical) |
| `locals.tf` | Local value declarations |

##### Indentation and Alignment

- Use **two spaces** per nesting level (no tabs)
- Align equals signs for consecutive arguments

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  subnet_id     = "subnet-12345678"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}
```

##### Block Organization

Arguments precede blocks, with meta-arguments first:

```hcl
resource "aws_instance" "example" {
  # Meta-arguments
  count = 3

  # Arguments
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  # Blocks
  root_block_device {
    volume_size = 20
  }

  # Lifecycle last
  lifecycle {
    create_before_destroy = true
  }
}
```

##### Naming Conventions

- Use **lowercase with underscores** for all names
- Use **descriptive nouns** excluding the resource type
- Be specific and meaningful

```hcl
# Bad
resource "aws_instance" "webAPI-aws-instance" {}
variable "name" {}

# Good
resource "aws_instance" "web_api" {}
variable "application_name" {}
```

##### Variables

Every variable must include `type` and `description`:

```hcl
variable "instance_type" {
  description = "EC2 instance type for the web server"
  type        = string
  default     = "t2.micro"

  validation {
    condition     = contains(["t2.micro", "t2.small", "t2.medium"], var.instance_type)
    error_message = "Instance type must be t2.micro, t2.small, or t2.medium."
  }
}

variable "database_password" {
  description = "Password for the database admin user"
  type        = string
  sensitive   = true
}
```

##### Outputs

Every output must include `description`:

```hcl
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "database_password" {
  description = "Database administrator password"
  value       = aws_db_instance.main.password
  sensitive   = true
}
```

##### Dynamic Resource Creation

**Prefer `for_each` over `count`** for multiple resources:

```hcl
# Bad - count for multiple resources
resource "aws_instance" "web" {
  count = var.instance_count
  tags  = { Name = "web-${count.index}" }
}

# Good - for_each with named instances
variable "instance_names" {
  type    = set(string)
  default = ["web-1", "web-2", "web-3"]
}

resource "aws_instance" "web" {
  for_each = var.instance_names
  tags     = { Name = each.key }
}
```

**Use `count` for conditional creation:**

```hcl
resource "aws_cloudwatch_metric_alarm" "cpu" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name = "high-cpu-usage"
  threshold  = 80
}
```

##### Version Pinning

```hcl
terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Allow minor updates
    }
  }
}
```

**Version constraint operators:**
- `= 1.0.0` - Exact version
- `>= 1.0.0` - Greater than or equal
- `~> 1.0` - Allow rightmost component to increment
- `>= 1.0, < 2.0` - Version range

##### Validation Tools

Run before committing:

```bash
terraform fmt -recursive
terraform validate
```

Additional tools:
- `tflint` - Linting and best practices
- `checkov` / `tfsec` - Security scanning

##### Code Review Checklist

- [ ] Code formatted with `terraform fmt`
- [ ] Configuration validated with `terraform validate`
- [ ] Files organized according to standard structure
- [ ] All variables have type and description
- [ ] All outputs have descriptions
- [ ] Resource names use descriptive nouns with underscores
- [ ] Version constraints pinned explicitly
- [ ] Sensitive values marked with `sensitive = true`
- [ ] No hardcoded credentials or secrets
- [ ] Security best practices applied

**Why**: Consistent formatting and structure improve code readability, maintainability, and reduce errors.

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

## Blueprint Catalog and Decision Tree

For complete blueprint catalog, decision trees, and cross-cloud equivalents, see:

**Reference**: [Blueprint Catalog](docs/blueprints/catalog.md)

The catalog includes:
- Complete blueprint table with descriptions, database types, API patterns, and origins
- Cross-cloud equivalents (AWS ↔ Azure ↔ GCP)
- Decision tree for selecting blueprints based on requirements
- Project-based queries using `find_by_project` MCP tool

**For dynamic discovery**, use MCP tools:
- `recommend_blueprint()` - Get blueprint recommendation based on requirements
- `search_blueprints()` - Search for blueprints by keywords
- `find_by_project()` - Find blueprints used by specific projects

## Workflow Guidance

For detailed workflow guidance, scenarios, and checklists, see:

**Reference**: [Workflow Guidance](references/workflows.md)

This includes:
- Pre-flight checklist before writing Terraform
- Step-by-step workflow guidance (new project, add capability, migrate cloud)
- Common scenarios with AI assistant actions
- Skills vs MCP Tools decision matrix
- Standalone code requirements

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

## MCP Tools for Discovery

For dynamic discovery and recommendations, use MCP tools:

- `recommend_blueprint()` - Get blueprint recommendation based on requirements
- `search_blueprints()` - Search for blueprints by keywords
- `find_by_project()` - Find blueprints used by specific projects
- `fetch_blueprint_file()` - Get specific blueprint files on-demand
- `extract_pattern()` - Get guidance on extracting specific capabilities
- `get_workflow_guidance()` - Get step-by-step workflow guidance

## References

- **Blueprint Catalog**: [docs/blueprints/catalog.md](docs/blueprints/catalog.md) - Complete catalog, decision trees, cross-cloud equivalents
- **Workflow Guidance**: [references/workflows.md](references/workflows.md) - Detailed workflows, scenarios, checklists
- **Pattern Examples**: [docs/blueprints/patterns.md](docs/blueprints/patterns.md) - Includes wrong vs right examples
- **MCP Server**: Configured separately - provides blueprint discovery tools
- **Blueprint Repository**: https://github.com/berTrindade/terraform-infrastructure-blueprints
- **AI Guidelines**: See `docs/ai-assistant-guidelines.md` in blueprint repository
