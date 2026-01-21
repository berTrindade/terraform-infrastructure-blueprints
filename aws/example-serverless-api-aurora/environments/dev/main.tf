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
# API Layer: Lambda (Official Module)
# ============================================
# Routes are defined in var.api_routes - add new routes there!

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "CRUD API handler for Aurora Serverless v2"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  # VPC configuration
  vpc_subnet_ids         = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.lambda.id]

  environment_variables = {
    DB_SECRET_ARN = module.secrets.secret_arn
    DB_HOST       = module.data.db_host
    DB_PORT       = tostring(module.data.db_port)
    DB_NAME       = var.db_name
  }

  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days

  # IAM permissions
  attach_policy_statements = true
  policy_statements = {
    secrets = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [module.secrets.secret_arn]
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

  depends_on = [module.secrets, module.data]
}

# ============================================
# API Gateway v2 (Official Module)
# ============================================
# Routes are dynamically generated from var.api_routes

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "Serverless API Gateway for Aurora"
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
