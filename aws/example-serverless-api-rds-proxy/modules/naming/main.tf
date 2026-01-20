# modules/naming/main.tf
# Naming convention module for Serverless REST API with RDS Proxy
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}
# Example: rest-api-dev-function

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_lambda  = "${local.prefix}-api-handler"

    # VPC resources
    vpc             = "${local.prefix}-vpc"
    private_subnet  = "${local.prefix}-private"
    security_group  = "${local.prefix}-sg"
    db_subnet_group = "${local.prefix}-db-subnet"

    # Data resources
    rds_instance   = "${local.prefix}-postgres"
    rds_identifier = "${local.prefix}-db"
    rds_proxy      = "${local.prefix}-proxy"

    # Secrets (naming: /{env}/{app}/{purpose})
    secret_prefix = "/${var.environment}/${var.project}"
    db_secret     = "/${var.environment}/${var.project}/db-credentials"

    # IAM resources
    api_role    = "${local.prefix}-api-role"
    lambda_role = "${local.prefix}-lambda-role"
    proxy_role  = "${local.prefix}-proxy-role"

    # CloudWatch resources
    log_group_api = "/aws/lambda/${local.prefix}-api-handler"
  }
}
