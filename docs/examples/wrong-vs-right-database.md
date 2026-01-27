# Wrong vs Right: Adding Database to Existing Project

This document shows side-by-side comparisons of incorrect (generic) Terraform code versus correct (blueprint-pattern) code when adding a database to an existing project.

## Scenario

**User Request**: "I have an existing Terraform project with API Gateway and Lambda. I need to add RDS PostgreSQL."

## ❌ Wrong Approach: Generic Terraform

### Problems with This Approach

1. **Password stored in Secrets Manager** - Password appears in Terraform state
2. **No IAM Database Authentication** - Uses password-based auth
3. **Raw VPC resources** - Manual VPC configuration instead of official module
4. **NAT Gateway for Lambda** - Expensive and unnecessary
5. **No blueprint reference** - Doesn't leverage existing patterns

### Wrong Code Example

```hcl
# ❌ WRONG: Generic Terraform without blueprint patterns

# Password stored in Secrets Manager (appears in state!)
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db" {
  name = "db-password"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = random_password.db_password.result  # ❌ Password in state!
}

# Raw VPC resources (should use official module)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  # Manual subnet creation...
}

resource "aws_subnet" "database" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  # Manual subnet creation...
}

# NAT Gateway (expensive for Lambda - should use VPC endpoints)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
}

# RDS without IAM Database Authentication
resource "aws_db_instance" "main" {
  identifier     = "myapp-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  db_name  = "myapp"
  username = "postgres"
  password = random_password.db_password.result  # ❌ Password-based auth

  # Missing IAM Database Authentication
  # iam_database_authentication_enabled = false  # ❌ Not enabled

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  publicly_accessible = false
  storage_encrypted  = true
}

# Manual security group rules
resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "RDS security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # ❌ Too permissive
  }
}

# Lambda IAM role without RDS auth permissions
resource "aws_iam_role" "lambda" {
  name = "lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# ❌ Missing IAM policy for RDS Database Authentication
# Applications must use password from Secrets Manager
```

### Issues Summary

| Issue | Impact | Fix |
|-------|--------|-----|
| Password in Secrets Manager | Password appears in Terraform state, security risk | Use ephemeral `password_wo` pattern |
| No IAM Database Authentication | Less secure, password-based auth | Enable `iam_database_authentication_enabled = true` |
| Raw VPC resources | Harder to maintain, missing best practices | Use `terraform-aws-modules/vpc/aws` |
| NAT Gateway for Lambda | Expensive ($32/month + data transfer) | Use VPC endpoints instead |
| Manual security groups | Error-prone, not following patterns | Reference blueprint security group patterns |
| No blueprint reference | Missing production-tested patterns | Use `extract_pattern(capability: "database")` |

## ✅ Right Approach: Blueprint Pattern

### Benefits of This Approach

1. **Ephemeral passwords** - Password never appears in Terraform state
2. **IAM Database Authentication** - More secure, no password management
3. **Official VPC module** - Battle-tested, well-maintained
4. **VPC endpoints** - Cost-effective for Lambda
5. **Blueprint reference** - Production-tested patterns from real projects

### Right Code Example

```hcl
# ✅ RIGHT: Blueprint pattern from apigw-lambda-rds

# Step 1: Use extract_pattern(capability: "database") tool
# Reference: blueprints://aws/apigw-lambda-rds/modules/data/main.tf

# Ephemeral password (Flow A) - NEVER in state
ephemeral "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Official VPC module (not raw resources)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs              = local.azs
  private_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  database_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count)]

  enable_nat_gateway = false  # ✅ Lambda uses VPC endpoints

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group       = true
  create_database_subnet_route_table = true
}

# VPC endpoints for Lambda (cost-effective)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
}

# RDS with IAM Database Authentication
module "data" {
  source = "./modules/data"  # Extracted from blueprint

  db_identifier            = "${var.project}-${var.environment}-db"
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = ephemeral.random_password.db.result  # ✅ Ephemeral
  db_password_version      = 1
  db_subnet_group_name     = module.vpc.database_subnet_group_name
  security_group_id        = aws_security_group.rds.id
  # ... other variables
}

# Inside modules/data/main.tf (from blueprint):
resource "aws_db_instance" "this" {
  identifier = var.db_identifier

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  db_name  = var.db_name
  username = var.db_username

  # ✅ Flow A: Write-only password (never in state)
  password_wo         = var.db_password
  password_wo_version = var.db_password_version

  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = var.db_subnet_group_name

  # ✅ IAM Database Authentication enabled
  iam_database_authentication_enabled = true

  publicly_accessible = false
  storage_encrypted  = true
}

# Security group with proper rules (from blueprint)
resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id  # ✅ From Lambda SG
  security_group_id        = aws_security_group.rds.id
  description              = "PostgreSQL from Lambda"
}

# Secrets Manager for connection metadata only (NO password)
module "secrets" {
  source = "./modules/secrets"  # Extracted from blueprint

  secret_name   = "${var.project}-${var.environment}-db-secret"
  db_identifier = module.data.db_identifier
  db_username   = var.db_username
  db_name       = var.db_name
  db_host       = module.data.db_host
  db_port       = module.data.db_port
  # ✅ NO password stored - only metadata
}

# Inside modules/secrets/main.tf (from blueprint):
resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  # ✅ Connection metadata only - NO PASSWORD
  secret_string = jsonencode({
    username = var.db_username
    host     = var.db_host
    port     = var.db_port
    dbname   = var.db_name
    engine   = "postgres"
    # Note: Password not stored. Use IAM Database Authentication.
  })
}

# Lambda IAM role with RDS Database Authentication
resource "aws_iam_role" "lambda" {
  name = "${var.project}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# ✅ IAM policy for RDS Database Authentication
resource "aws_iam_policy" "rds_auth" {
  name        = "${var.project}-${var.environment}-lambda-rds-auth"
  description = "Allow Lambda to authenticate to RDS using IAM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${module.data.db_resource_id}/${var.db_username}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_rds" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.rds_auth.arn
}
```

### Key Differences Summary

| Aspect | ❌ Wrong | ✅ Right |
|--------|---------|---------|
| **Password Storage** | Secrets Manager (in state) | Ephemeral `password_wo` (never in state) |
| **Authentication** | Password-based | IAM Database Authentication |
| **VPC** | Raw resources | Official `terraform-aws-modules/vpc/aws` |
| **Networking** | NAT Gateway ($32/month) | VPC Endpoints (pay per request) |
| **Security Groups** | Manual, permissive | Blueprint pattern, least privilege |
| **Secrets Manager** | Stores password | Stores metadata only |
| **IAM Permissions** | Missing RDS auth | `rds-db:connect` policy |
| **Blueprint Reference** | None | `apigw-lambda-rds` blueprint |

## How to Get the Right Code

### Step 1: Use MCP Tool

```typescript
extract_pattern(capability: "database")
```

**Returns**:
- Source blueprint: `apigw-lambda-rds`
- Modules to extract: `modules/data/`, `modules/networking/`
- Integration steps
- MCP resource URIs for reference files

### Step 2: Reference Blueprint Files

Access actual code via MCP resources:
- `blueprints://aws/apigw-lambda-rds/modules/data/main.tf`
- `blueprints://aws/apigw-lambda-rds/environments/dev/main.tf`
- `blueprints://aws/apigw-lambda-rds/modules/secrets/main.tf`

### Step 3: Extract and Adapt

1. Copy `modules/data/` from blueprint
2. Copy `modules/secrets/` from blueprint
3. Copy relevant security group rules
4. Adapt variables to match existing project naming
5. Update VPC references to existing VPC (if applicable)

### Step 4: Verify Patterns

Check that extracted code follows:
- ✅ Ephemeral passwords (`password_wo`)
- ✅ IAM Database Authentication enabled
- ✅ Official Terraform modules used
- ✅ VPC endpoints (not NAT Gateway)
- ✅ Security groups follow blueprint patterns

## Cost Comparison

### Wrong Approach (NAT Gateway)
- NAT Gateway: ~$32/month
- Data transfer: ~$0.045/GB
- **Total**: ~$32-50/month for small projects

### Right Approach (VPC Endpoints)
- VPC Endpoint: ~$7/month per endpoint
- Data transfer: ~$0.01/GB (much cheaper)
- **Total**: ~$7-15/month for small projects

**Savings**: ~$20-35/month by using VPC endpoints

## Security Comparison

### Wrong Approach
- ❌ Password in Terraform state
- ❌ Password in Secrets Manager
- ❌ Password-based authentication
- ❌ Manual security group rules (error-prone)

### Right Approach
- ✅ Password never in Terraform state
- ✅ Only metadata in Secrets Manager
- ✅ IAM Database Authentication (token-based)
- ✅ Blueprint-tested security group patterns

## Summary

**Always**:
1. Use `extract_pattern(capability: "database")` tool first
2. Reference blueprint files via MCP resources
3. Follow ephemeral password pattern (`password_wo`)
4. Enable IAM Database Authentication
5. Use official Terraform modules
6. Use VPC endpoints for Lambda (not NAT Gateway)

**Never**:
1. Store passwords in Secrets Manager
2. Use password-based authentication
3. Create raw VPC resources manually
4. Use NAT Gateway for Lambda
5. Skip blueprint reference

For more examples and patterns, see:
- [AI Assistant Guidelines](ai-assistant-guidelines.md)
- [Blueprint Patterns](blueprints/patterns.md)
- [Blueprint Catalog](blueprints/catalog.md)
