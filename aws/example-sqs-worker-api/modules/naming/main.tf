# modules/naming/main.tf
# Naming convention module
# Based on terraform-skill module-patterns

# Naming convention: {project}-{environment}-{component}
# Example: sqs-worker-dev-api

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # API resources
    api_gateway = "${local.prefix}-api"
    api_role    = "${local.prefix}-api-role"

    # Data resources
    dynamodb_table = "${local.prefix}-commands"

    # Queue resources
    sqs_queue = "${local.prefix}-work-queue"
    sqs_dlq   = "${local.prefix}-work-dlq"

    # Worker resources
    worker_lambda = "${local.prefix}-worker"
    worker_role   = "${local.prefix}-worker-role"

    # Secrets (Flow B naming: /{env}/{app}/{purpose})
    secret_prefix = "/${var.environment}/${var.project}"

    # CloudWatch resources
    log_group_worker = "/aws/lambda/${local.prefix}-worker"
  }
}
