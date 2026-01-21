# modules/naming/main.tf
# Naming convention module for Serverless API with Cognito

locals {
  prefix = "${var.project}-${var.environment}"

  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_lambda  = "${local.prefix}-api-handler"

    # Auth resources
    user_pool        = "${local.prefix}-users"
    user_pool_client = "${local.prefix}-client"

    # Data resources
    dynamodb_table = "${local.prefix}-items"

    # IAM resources
    lambda_role = "${local.prefix}-lambda-role"

    # CloudWatch resources
    log_group_api = "/aws/lambda/${local.prefix}-api-handler"
  }
}
