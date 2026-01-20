# modules/naming/main.tf
# Naming convention for Bedrock RAG API

locals {
  prefix = "${var.project}-${var.environment}"

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
    lambda_role        = "${local.prefix}-lambda-role"
    knowledge_base_role = "${local.prefix}-kb-role"

    # CloudWatch
    log_group_api = "/aws/lambda/${local.prefix}-query-handler"
  }
}
