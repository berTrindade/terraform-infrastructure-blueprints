# environments/dev/main.tf
# Development environment composition (API Gateway → EventBridge → Consumers)
# Demonstrates event-driven architecture with EventBridge routing rules
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
# EventBridge Event Bus
# ============================================

module "event_bus" {
  source = "../../modules/event_bus"

  bus_name               = module.naming.event_bus
  archive_name           = module.naming.archive
  enable_archive         = var.enable_archive
  archive_retention_days = var.archive_retention_days

  tags = module.tagging.tags
}

# ============================================
# API Layer: API Gateway → EventBridge
# ============================================

module "api" {
  source = "../../modules/api"

  api_name           = module.naming.api_gateway
  role_name          = module.naming.api_role
  event_bus_arn      = module.event_bus.bus_arn
  event_bus_name     = module.event_bus.bus_name
  event_source       = var.event_source
  cors_allow_origins = var.cors_allow_origins
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Consumer 1: PDF Generator
# ============================================

module "pdf_generator" {
  source = "../../modules/consumer"

  # Queue
  queue_name                 = "${module.naming.prefix}-pdf-queue"
  dlq_name                   = "${module.naming.prefix}-pdf-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

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

# EventBridge Rule: Route ReportRequested to PDF Generator
module "pdf_generator_rule" {
  source = "../../modules/rule"

  rule_name      = "${module.naming.prefix}-pdf-rule"
  description    = "Route ReportRequested events to PDF Generator"
  event_bus_name = module.event_bus.bus_name

  # Event pattern: match ReportRequested from our source
  event_pattern = jsonencode({
    source      = [var.event_source]
    detail-type = ["ReportRequested"]
  })

  # Target
  target_id     = "pdf-generator"
  sqs_queue_arn = module.pdf_generator.queue_arn
  sqs_queue_url = module.pdf_generator.queue_url

  tags = module.tagging.tags
}

# ============================================
# Consumer 2: Audit Logger
# ============================================

module "audit_logger" {
  source = "../../modules/consumer"

  # Queue
  queue_name                 = "${module.naming.prefix}-audit-queue"
  dlq_name                   = "${module.naming.prefix}-audit-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

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

# EventBridge Rule: Route ALL events to Audit Logger
module "audit_logger_rule" {
  source = "../../modules/rule"

  rule_name      = "${module.naming.prefix}-audit-rule"
  description    = "Route ALL events to Audit Logger"
  event_bus_name = module.event_bus.bus_name

  # Event pattern: catch-all for our source
  event_pattern = jsonencode({
    source = [var.event_source]
  })

  # Target
  target_id     = "audit-logger"
  sqs_queue_arn = module.audit_logger.queue_arn
  sqs_queue_url = module.audit_logger.queue_url

  tags = module.tagging.tags
}

# ============================================
# Consumer 3: Notifier
# ============================================

module "notifier" {
  source = "../../modules/consumer"

  # Queue
  queue_name                 = "${module.naming.prefix}-notify-queue"
  dlq_name                   = "${module.naming.prefix}-notify-dlq"
  message_retention_seconds  = var.sqs_retention_seconds
  dlq_retention_seconds      = var.dlq_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  max_receive_count          = var.sqs_max_receive_count

  # Lambda
  function_name = "${module.naming.prefix}-notifier"
  description   = "Sends notifications for specific events"
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

# EventBridge Rule: Route specific events to Notifier (content-based filtering)
module "notifier_rule" {
  source = "../../modules/rule"

  rule_name      = "${module.naming.prefix}-notify-rule"
  description    = "Route notification-worthy events to Notifier"
  event_bus_name = module.event_bus.bus_name

  # Event pattern: content-based filtering
  # Only notify for specific event types and report types
  event_pattern = var.notifier_event_pattern != null ? var.notifier_event_pattern : jsonencode({
    source      = [var.event_source]
    detail-type = ["ReportRequested", "ReportGenerated", "ReportFailed"]
  })

  # Target
  target_id     = "notifier"
  sqs_queue_arn = module.notifier.queue_arn
  sqs_queue_url = module.notifier.queue_url

  tags = module.tagging.tags
}
