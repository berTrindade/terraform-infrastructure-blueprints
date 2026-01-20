# environments/dev/main.tf
# Development environment composition for Serverless REST API with RDS Proxy
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
  db_subnet_group_name  = module.vpc.db_subnet_group_name
  rds_security_group_id = module.vpc.rds_security_group_id
  multi_az              = var.db_multi_az
  backup_retention_period      = var.db_backup_retention_period
  performance_insights_enabled = var.db_performance_insights_enabled
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = var.db_skip_final_snapshot
  apply_immediately            = var.db_apply_immediately

  # RDS Proxy Configuration
  proxy_name                         = module.naming.rds_proxy
  proxy_role_name                    = module.naming.proxy_role
  proxy_security_group_id            = module.vpc.proxy_security_group_id
  subnet_ids                         = module.vpc.private_subnet_ids
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
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.vpc.lambda_security_group_id

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
