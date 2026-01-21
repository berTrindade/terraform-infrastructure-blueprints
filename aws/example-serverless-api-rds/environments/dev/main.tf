# environments/dev/main.tf
# Development environment composition for Serverless REST API with RDS
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

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr

  azs              = local.azs
  private_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  database_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count)]

  enable_nat_gateway = false # Lambda uses VPC endpoints

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group       = true
  create_database_subnet_route_table = true

  tags = module.tagging.tags
}

# ============================================
# Security Groups
# ============================================

resource "aws_security_group" "lambda" {
  name        = "${module.naming.security_group}-lambda"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
    description     = "PostgreSQL to RDS"
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
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "PostgreSQL from Lambda"
}

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
# RDS PostgreSQL (Official Module)
# ============================================

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = module.naming.rds_identifier

  engine               = "postgres"
  engine_version       = var.db_engine_version
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result
  port     = 5432

  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.db_multi_az

  backup_retention_period = var.db_backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = var.db_performance_insights_enabled

  deletion_protection       = var.db_deletion_protection
  skip_final_snapshot       = var.db_skip_final_snapshot
  final_snapshot_identifier = var.db_skip_final_snapshot ? null : "${module.naming.rds_identifier}-final"
  apply_immediately         = var.db_apply_immediately

  # Parameter group
  parameters = [
    {
      name  = "log_statement"
      value = "all"
    },
    {
      name  = "log_min_duration_statement"
      value = "1000"
    }
  ]

  tags = module.tagging.tags
}

resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
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
  db_host                 = module.rds.db_instance_address
  db_port                 = module.rds.db_instance_port
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags

  depends_on = [module.rds]
}

# ============================================
# Lambda Function (Official Module)
# ============================================

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "REST API for RDS PostgreSQL CRUD operations"
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
    DB_HOST       = module.rds.db_instance_address
    DB_PORT       = tostring(module.rds.db_instance_port)
    DB_NAME       = var.db_name
  }

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

  attach_network_policy = true

  # API Gateway trigger
  allowed_triggers = {
    APIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  tags = module.tagging.tags

  depends_on = [module.secrets, module.rds]
}

# ============================================
# API Gateway (Official Module)
# ============================================

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "REST API for RDS PostgreSQL"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  create_routes_and_integrations = true
  routes = {
    "POST /items" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
    "GET /items" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
    "GET /items/{id}" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
    "PUT /items/{id}" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
    "DELETE /items/{id}" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
  }

  tags = module.tagging.tags
}
