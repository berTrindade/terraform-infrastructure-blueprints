# environments/dev/main.tf
# Development environment composition (API Gateway → SNS → Subscribers)
# Demonstrates event-driven architecture with SNS fan-out
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
# SNS Topic (Event Bus)
# ============================================

module "topic" {
  source = "../../modules/topic"

  topic_name = module.naming.sns_topic

  tags = module.tagging.tags
}

# ============================================
# API Layer: API Gateway → SNS
# ============================================

module "api" {
  source = "../../modules/api"

  api_name           = module.naming.api_gateway
  role_name          = module.naming.api_role
  sns_topic_arn      = module.topic.topic_arn
  cors_allow_origins = var.cors_allow_origins
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Subscriber 1: PDF Generator
# ============================================

module "pdf_generator" {
  source = "../../modules/subscriber"

  # Queue
  queue_name                 = "${module.naming.prefix}-pdf-queue"
  dlq_name                   = "${module.naming.prefix}-pdf-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

  # SNS Subscription
  sns_topic_arn        = module.topic.topic_arn
  raw_message_delivery = true
  # No filter - receives all ReportRequested events

  # Lambda
  function_name = "${module.naming.prefix}-pdf-generator"
  description   = "Generates PDF reports from ReportRequested events"
  role_name     = "${module.naming.prefix}-pdf-role"
  source_dir    = "${path.module}/../../src/pdf-generator"
  memory_size   = var.consumer_memory_size
  timeout       = var.consumer_timeout

  # SQS Event Source
  batch_size              = var.consumer_batch_size
  batching_window_seconds = var.consumer_batching_window_seconds
  max_concurrency         = var.consumer_max_concurrency

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Subscriber 2: Audit Logger
# ============================================

module "audit_logger" {
  source = "../../modules/subscriber"

  # Queue
  queue_name                 = "${module.naming.prefix}-audit-queue"
  dlq_name                   = "${module.naming.prefix}-audit-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

  # SNS Subscription
  sns_topic_arn        = module.topic.topic_arn
  raw_message_delivery = true
  # No filter - audit logger receives ALL events

  # Lambda
  function_name = "${module.naming.prefix}-audit-logger"
  description   = "Logs all events for audit/compliance"
  role_name     = "${module.naming.prefix}-audit-role"
  source_dir    = "${path.module}/../../src/audit-logger"
  memory_size   = var.consumer_memory_size
  timeout       = var.consumer_timeout

  # SQS Event Source
  batch_size              = var.consumer_batch_size
  batching_window_seconds = var.consumer_batching_window_seconds
  max_concurrency         = var.consumer_max_concurrency

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Subscriber 3: Notifier
# ============================================

module "notifier" {
  source = "../../modules/subscriber"

  # Queue
  queue_name                 = "${module.naming.prefix}-notify-queue"
  dlq_name                   = "${module.naming.prefix}-notify-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

  # SNS Subscription with filter policy
  sns_topic_arn        = module.topic.topic_arn
  raw_message_delivery = true

  # Optional: Filter to only certain event types
  # This demonstrates SNS subscription filtering
  filter_policy = var.notifier_filter_policy
  filter_policy_scope = "MessageBody"

  # Lambda
  function_name = "${module.naming.prefix}-notifier"
  description   = "Sends notifications for events"
  role_name     = "${module.naming.prefix}-notify-role"
  source_dir    = "${path.module}/../../src/notifier"
  memory_size   = var.consumer_memory_size
  timeout       = var.consumer_timeout

  environment_variables = {
    NOTIFICATION_WEBHOOK = var.notification_webhook
    SLACK_WEBHOOK        = var.slack_webhook
  }

  # SQS Event Source
  batch_size              = var.consumer_batch_size
  batching_window_seconds = var.consumer_batching_window_seconds
  max_concurrency         = var.consumer_max_concurrency

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}
