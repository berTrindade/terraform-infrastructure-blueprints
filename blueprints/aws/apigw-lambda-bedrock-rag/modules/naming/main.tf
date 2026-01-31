# modules/naming/main.tf
# Naming convention for Bedrock RAG API
# Based on terraform-secrets-poc standard for secret naming

locals {
  prefix = "${var.project}-${var.environment}"

  # Short environment name for secrets path
  env_short = {
    development = "dev"
    staging     = "staging"
    production  = "prod"
    dev         = "dev"
    stg         = "staging"
    prod        = "prod"
  }

  env = lookup(local.env_short, var.environment, var.environment)

  names = {
    # Storage
    documents_bucket = "${local.prefix}-documents"

    # Vector store
    opensearch_collection = "${local.prefix}-vectors"

    # Knowledge Base
    knowledge_base = "${local.prefix}-kb"
    data_source    = "${local.prefix}-datasource"

    # API
    api_gateway = "${local.prefix}-api"
    api_lambda  = "${local.prefix}-query-handler"

    # IAM
    lambda_role         = "${local.prefix}-lambda-role"
    knowledge_base_role = "${local.prefix}-kb-role"

    # CloudWatch
    log_group_api = "/aws/lambda/${local.prefix}-query-handler"

    # Secrets (naming: /{env}/{app})
    secret_prefix = "/${local.env}/${var.project}"
  }
}
