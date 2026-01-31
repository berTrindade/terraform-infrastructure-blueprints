# modules/naming/main.tf
# Naming convention module for SNS Fanout API
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}
# Example: sns-fanout-dev-api

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_role    = "${local.prefix}-api-role"

    # SNS resources
    sns_topic = "${local.prefix}-events"

    # CloudWatch resources
    log_group_api = "/aws/apigateway/${local.prefix}-api"
  }
}
