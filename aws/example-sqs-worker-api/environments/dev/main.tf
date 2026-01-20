# environments/dev/main.tf
# Development environment composition (API Gateway → SQS → Worker)
# Based on terraform-skill module-patterns (composition layer)

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
# Secrets Manager (Flow B shells)
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secret_prefix           = module.naming.secret_prefix
  secrets                 = var.secrets
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags
}

# ============================================
# Data Layer: DynamoDB
# ============================================

module "data" {
  source = "../../modules/data"

  table_name                    = module.naming.dynamodb_table
  enable_point_in_time_recovery = var.enable_dynamodb_pitr
  ttl_attribute_name            = var.dynamodb_ttl_attribute

  tags = module.tagging.tags
}

# ============================================
# Queue Layer: SQS + DLQ
# ============================================

module "queue" {
  source = "../../modules/queue"

  queue_name                 = module.naming.sqs_queue
  dlq_name                   = module.naming.sqs_dlq
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

  tags = module.tagging.tags
}

# ============================================
# API Layer: API Gateway → SQS
# ============================================

module "api" {
  source = "../../modules/api"

  # API Gateway
  api_name           = module.naming.api_gateway
  role_name          = module.naming.api_role
  cors_allow_origins = var.cors_allow_origins

  # Integration: SQS (direct)
  sqs_queue_url = module.queue.queue_url
  sqs_queue_arn = module.queue.queue_arn

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Worker Layer: Worker Lambda + SQS Trigger
# ============================================

module "worker" {
  source = "../../modules/worker"

  # Lambda
  function_name  = module.naming.worker_lambda
  role_name      = module.naming.worker_role
  log_group_name = module.naming.log_group_worker
  source_dir     = "${path.module}/../../src/worker"
  memory_size    = var.worker_memory_size
  timeout        = var.worker_timeout

  # SQS Event Source
  sqs_queue_arn           = module.queue.queue_arn
  batch_size              = var.worker_batch_size
  batching_window_seconds = var.worker_batching_window_seconds
  max_concurrency         = var.worker_max_concurrency

  # Integration: DynamoDB
  dynamodb_table_name = module.data.table_name
  dynamodb_table_arn  = module.data.table_arn

  # Integration: Secrets (optional)
  secret_arns = module.secrets.all_secret_arns
  external_api_secret_arn = lookup(
    module.secrets.secret_arns,
    "external-api-key",
    null
  )

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}
