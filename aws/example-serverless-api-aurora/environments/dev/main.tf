# environments/dev/main.tf
# Development environment composition for Serverless REST API with Aurora Serverless v2
# Uses official terraform-aws-modules for battle-tested infrastructure

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================
# Naming and Tagging
# ============================================

module "naming" {
  source = "../../modules/naming"

  project     = var.project
  environment = var.environment
}

module "tagging" {
  source = "../../modules/tagging"

  project     = var.project
  environment = var.environment
  repository  = var.repository

  additional_tags = var.additional_tags
}

# ============================================
# VPC and Networking (Official Module)
# ============================================

# Official VPC Module - https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]

  # No NAT gateway - Lambda uses VPC endpoints
  enable_nat_gateway = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group       = true
  create_database_subnet_route_table = true

  tags = module.tagging.tags
}

# ============================================
# Security Groups
# ============================================

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name        = "${module.naming.security_group}-lambda"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.aurora.id]
    description     = "PostgreSQL to Aurora"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS APIs"
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-lambda" })
}

# Aurora Security Group
resource "aws_security_group" "aurora" {
  name        = "${module.naming.security_group}-aurora"
  description = "Security group for Aurora Serverless v2"
  vpc_id      = module.vpc.vpc_id

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-aurora" })
}

resource "aws_security_group_rule" "aurora_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.aurora.id
  description              = "PostgreSQL from Lambda"
}

# VPC Endpoints Security Group
resource "aws_security_group" "vpc_endpoints" {
  name        = "${module.naming.security_group}-vpc-endpoints"
  description = "Security group for VPC endpoints"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTPS from Lambda"
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-vpc-endpoints" })
}

# ============================================
# VPC Endpoints
# ============================================

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(module.tagging.tags, { Name = "${module.naming.vpc}-secretsmanager-endpoint" })
}

# ============================================
# Secrets Manager (DB Credentials)
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secret_name             = module.naming.db_secret
  db_identifier           = module.naming.aurora_identifier
  db_username             = var.db_username
  db_name                 = var.db_name
  db_host                 = module.data.db_host
  db_port                 = module.data.db_port
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags

  depends_on = [module.data]
}

# ============================================
# Data Layer: Aurora Serverless v2
# ============================================

module "data" {
  source = "../../modules/data"

  cluster_identifier               = module.naming.aurora_identifier
  db_name                          = var.db_name
  db_username                      = var.db_username
  db_password                      = random_password.db_temp.result
  engine_version                   = var.aurora_engine_version
  instance_count                   = var.aurora_instance_count
  min_capacity                     = var.aurora_min_capacity
  max_capacity                     = var.aurora_max_capacity
  db_subnet_group_name             = module.vpc.database_subnet_group_name
  security_group_id                = aws_security_group.aurora.id
  backup_retention_period          = var.db_backup_retention_period
  performance_insights_enabled     = var.db_performance_insights_enabled
  deletion_protection              = var.db_deletion_protection
  skip_final_snapshot              = var.db_skip_final_snapshot
  apply_immediately                = var.db_apply_immediately

  tags = module.tagging.tags
}

# Temporary password for Aurora (will be replaced by secrets module)
resource "random_password" "db_temp" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ============================================
# API Layer: API Gateway + Lambda
# ============================================

module "api" {
  source = "../../modules/api"

  # API Gateway
  api_name           = module.naming.api_gateway
  cors_allow_origins = var.cors_allow_origins

  # Lambda
  function_name  = module.naming.api_lambda
  role_name      = module.naming.lambda_role
  log_group_name = module.naming.log_group_api
  source_dir     = "${path.module}/../../src/api"
  memory_size    = var.lambda_memory_size
  timeout        = var.lambda_timeout

  # VPC configuration
  subnet_ids        = module.vpc.private_subnets
  security_group_id = aws_security_group.lambda.id

  # Database configuration
  db_secret_arn = module.secrets.secret_arn
  db_host       = module.data.db_host
  db_port       = module.data.db_port
  db_name       = var.db_name

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags

  depends_on = [module.secrets, module.data]
}
