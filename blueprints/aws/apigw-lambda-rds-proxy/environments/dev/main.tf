# environments/dev/main.tf
# Serverless REST API with RDS Proxy - AWS-Managed Master Password
# Based on terraform-secrets-poc engineering standard
#
# Secret handling:
#   - AWS RDS manages the master password automatically
#   - Password stored in RDS-managed Secrets Manager secret
#   - RDS Proxy authenticates using this managed secret
#   - Password NEVER in Terraform state
#   - Applications connect via Proxy (connection pooling)

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
# Data Layer: RDS PostgreSQL + RDS Proxy
# Password managed by RDS (manage_master_user_password)
# ============================================

module "data" {
  source = "../../modules/data"

  # RDS Configuration
  db_identifier            = module.naming.rds_identifier
  db_name                  = var.db_name
  db_username              = var.db_username
  # Note: No password - managed by RDS
  engine_version               = var.db_engine_version
  instance_class               = var.db_instance_class
  allocated_storage            = var.db_allocated_storage
  max_allocated_storage        = var.db_max_allocated_storage
  db_subnet_group_name         = module.vpc.database_subnet_group_name
  rds_security_group_id        = aws_security_group.rds.id
  multi_az                     = var.db_multi_az
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
  # Note: No db_secret_arn - Proxy uses RDS-managed secret
  proxy_debug_logging                = var.proxy_debug_logging
  proxy_idle_timeout                 = var.proxy_idle_timeout
  proxy_connection_borrow_timeout    = var.proxy_connection_borrow_timeout
  proxy_max_connections_percent      = var.proxy_max_connections_percent
  proxy_max_idle_connections_percent = var.proxy_max_idle_connections_percent

  tags = module.tagging.tags
}

# ============================================
# Secrets: Connection Metadata (No Password)
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secret_name             = module.naming.db_secret
  db_identifier           = module.naming.rds_identifier
  db_username             = var.db_username
  db_name                 = var.db_name
  db_host                 = module.data.db_host
  proxy_host              = module.data.proxy_endpoint
  db_port                 = 5432
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags

  depends_on = [module.data]
}

# ============================================
# API Layer: Lambda (Official Module)
# ============================================
# Routes are defined in var.api_routes - add new routes there!

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "CRUD API handler for RDS via Proxy"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  # VPC configuration
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.lambda.id]

  environment_variables = {
    DB_METADATA_SECRET_ARN = module.secrets.metadata_secret_arn
    DB_PASSWORD_SECRET_ARN = module.data.master_user_secret_arn
    DB_HOST                = module.data.proxy_endpoint # Connect via Proxy
    DB_PORT                = "5432"
    DB_NAME                = var.db_name
    DB_USER                = var.db_username
  }

  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days

  # IAM permissions
  attach_policy_statements = true
  policy_statements = {
    # Read connection metadata
    metadata_secret = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [module.secrets.metadata_secret_arn]
    }
    # Read password from RDS-managed secret
    password_secret = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [module.data.master_user_secret_arn]
    }
  }

  # Attach VPC policy for ENI creation
  attach_network_policy = true

  # API Gateway trigger
  allowed_triggers = {
    APIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  tags = module.tagging.tags

  depends_on = [module.data]
}

# ============================================
# API Gateway v2 (Official Module)
# ============================================
# Routes are dynamically generated from var.api_routes

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "Serverless API Gateway for RDS Proxy"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  # Dynamic routes from var.api_routes - like serverless.yml!
  # Add new routes by updating the api_routes variable
  create_routes_and_integrations = true
  routes = {
    for name, config in var.api_routes : "${config.method} ${config.path}" => {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
  }

  tags = module.tagging.tags
}
