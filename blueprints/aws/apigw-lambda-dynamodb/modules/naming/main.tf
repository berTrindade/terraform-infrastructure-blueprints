# modules/naming/main.tf
# Naming convention module for Serverless REST API with DynamoDB
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}

locals {
  prefix = "${var.project}-${var.environment}"

  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_lambda  = "${local.prefix}-api-handler"

    # Data resources
    dynamodb_table = "${local.prefix}-items"

    # IAM resources
    lambda_role = "${local.prefix}-lambda-role"

    # CloudWatch resources
    log_group_api = "/aws/lambda/${local.prefix}-api-handler"
  }
}
