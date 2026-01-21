# environments/dev/main.tf
# Development environment composition for Serverless REST API with RDS Proxy
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
    security_groups = [aws_security_group.proxy.id]
    description     = "PostgreSQL to RDS Proxy"
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

# RDS Proxy Security Group
resource "aws_security_group" "proxy" {
  name        = "${module.naming.security_group}-proxy"
  description = "Security group for RDS Proxy"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
    description     = "PostgreSQL to RDS"
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-proxy" })
}

resource "aws_security_group_rule" "proxy_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.proxy.id
  description              = "PostgreSQL from Lambda"
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${module.naming.security_group}-rds"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-rds" })
}

resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.proxy.id
  security_group_id        = aws_security_group.rds.id
  description              = "PostgreSQL from RDS Proxy"
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
    security_groups = [aws_security_group.lambda.id, aws_security_group.proxy.id]
    description     = "HTTPS from Lambda and Proxy"
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

# Create secrets first (before RDS, needed for Proxy)
module "secrets" {
  source = "../../modules/secrets"

  secret_name             = module.naming.db_secret
  db_identifier           = module.naming.rds_identifier
  db_username             = var.db_username
  db_name                 = var.db_name
  db_host                 = "" # Will be updated after RDS creation
  db_port                 = 5432
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags
}

# ============================================
# Data Layer: RDS PostgreSQL + RDS Proxy
# ============================================

module "data" {
  source = "../../modules/data"

  # RDS Configuration
  db_identifier         = module.naming.rds_identifier
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = module.secrets.db_password
  engine_version        = var.db_engine_version
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  db_subnet_group_name  = module.vpc.database_subnet_group_name
  rds_security_group_id = aws_security_group.rds.id
  multi_az              = var.db_multi_az
  backup_retention_period      = var.db_backup_retention_period
  performance_insights_enabled = var.db_performance_insights_enabled
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = var.db_skip_final_snapshot
  apply_immediately            = var.db_apply_immediately

  # RDS Proxy Configuration
  proxy_name                         = module.naming.rds_proxy
  proxy_role_name                    = module.naming.proxy_role
  proxy_security_group_id            = aws_security_group.proxy.id
  subnet_ids                         = module.vpc.private_subnets
  db_secret_arn                      = module.secrets.secret_arn
  proxy_debug_logging                = var.proxy_debug_logging
  proxy_idle_timeout                 = var.proxy_idle_timeout
  proxy_connection_borrow_timeout    = var.proxy_connection_borrow_timeout
  proxy_max_connections_percent      = var.proxy_max_connections_percent
  proxy_max_idle_connections_percent = var.proxy_max_idle_connections_percent

  tags = module.tagging.tags

  depends_on = [module.secrets]
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

  # Database configuration (via Proxy)
  db_secret_arn = module.secrets.secret_arn
  db_host       = module.data.proxy_endpoint # Connect via Proxy, not direct RDS
  db_port       = 5432
  db_name       = var.db_name

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags

  depends_on = [module.data]
}
