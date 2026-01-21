# modules/naming/main.tf
# Naming convention module for EventBridge Fanout API
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}
# Example: eb-fanout-dev-api

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_role    = "${local.prefix}-api-role"

    # EventBridge resources
    event_bus = "${local.prefix}-bus"
    archive   = "${local.prefix}-archive"

    # CloudWatch resources
    log_group_api = "/aws/apigateway/${local.prefix}-api"
  }
}
