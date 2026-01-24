# modules/naming/main.tf
# Naming convention module for AppSync GraphQL API with Aurora Serverless v2
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}
# Example: graphql-api-dev-appsync

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # API resources
    appsync_api = "${local.prefix}-appsync"
    lambda_resolver = "${local.prefix}-resolver"

    # VPC resources
    vpc             = "${local.prefix}-vpc"
    private_subnet  = "${local.prefix}-private"
    security_group  = "${local.prefix}-sg"
    db_subnet_group = "${local.prefix}-db-subnet"

    # Data resources
    aurora_cluster    = "${local.prefix}-aurora"
    aurora_identifier = "${local.prefix}-aurora-cluster"

    # Auth resources
    cognito_user_pool = "${local.prefix}-user-pool"
    cognito_client    = "${local.prefix}-client"

    # Secrets (naming: /{env}/{app}/{purpose})
    secret_prefix = "/${var.environment}/${var.project}"
    db_secret     = "/${var.environment}/${var.project}/db-credentials"

    # IAM resources
    appsync_role = "${local.prefix}-appsync-role"
    lambda_role  = "${local.prefix}-lambda-role"

    # CloudWatch resources
    log_group_lambda = "/aws/lambda/${local.prefix}-resolver"
  }
}
