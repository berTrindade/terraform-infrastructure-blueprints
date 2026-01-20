# environments/dev/main.tf
# Development environment composition for Serverless REST API with RDS
# Based on terraform-skill module-patterns (composition layer)

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
# VPC and Networking
# ============================================

module "vpc" {
  source = "../../modules/vpc"

  vpc_name              = module.naming.vpc
  vpc_cidr              = var.vpc_cidr
  az_count              = var.az_count
  subnet_name_prefix    = module.naming.private_subnet
  db_subnet_group_name  = module.naming.db_subnet_group
  security_group_prefix = module.naming.security_group
  aws_region            = var.aws_region

  tags = module.tagging.tags
}

# ============================================
# Secrets Manager (DB Credentials)
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secret_name             = module.naming.db_secret
  db_identifier           = module.naming.rds_identifier
  db_username             = var.db_username
  db_name                 = var.db_name
  db_host                 = module.data.db_host
  db_port                 = module.data.db_port
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags

  depends_on = [module.data]
}

# ============================================
# Data Layer: RDS PostgreSQL
# ============================================

module "data" {
  source = "../../modules/data"

  db_identifier         = module.naming.rds_identifier
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = random_password.db_temp.result
  engine_version        = var.db_engine_version
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  db_subnet_group_name  = module.vpc.db_subnet_group_name
  security_group_id     = module.vpc.rds_security_group_id
  multi_az              = var.db_multi_az
  backup_retention_period      = var.db_backup_retention_period
  performance_insights_enabled = var.db_performance_insights_enabled
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = var.db_skip_final_snapshot
  apply_immediately            = var.db_apply_immediately

  tags = module.tagging.tags
}

# Temporary password for RDS (will be replaced by secrets module)
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
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.vpc.lambda_security_group_id

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
