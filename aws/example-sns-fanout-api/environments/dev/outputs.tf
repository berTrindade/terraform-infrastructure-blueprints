# environments/dev/outputs.tf
# Development environment outputs (API Gateway → SNS → Subscribers)
# Based on terraform-skill module-patterns (output best practices)

# ============================================
# API Gateway
# ============================================

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_endpoint
}

output "events_endpoint" {
  description = "Full URL for POST /events"
  value       = module.api.events_endpoint
}

# ============================================
# SNS Topic
# ============================================

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = module.topic.topic_arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic"
  value       = module.topic.topic_name
}

# ============================================
# PDF Generator Subscriber
# ============================================

output "pdf_generator_queue_url" {
  description = "URL of the PDF generator queue"
  value       = module.pdf_generator.queue_url
}

output "pdf_generator_dlq_url" {
  description = "URL of the PDF generator DLQ"
  value       = module.pdf_generator.dlq_url
}

output "pdf_generator_function_name" {
  description = "Name of the PDF generator Lambda"
  value       = module.pdf_generator.lambda_function_name
}

# ============================================
# Audit Logger Subscriber
# ============================================

output "audit_logger_queue_url" {
  description = "URL of the audit logger queue"
  value       = module.audit_logger.queue_url
}

output "audit_logger_dlq_url" {
  description = "URL of the audit logger DLQ"
  value       = module.audit_logger.dlq_url
}

output "audit_logger_function_name" {
  description = "Name of the audit logger Lambda"
  value       = module.audit_logger.lambda_function_name
}

# ============================================
# Notifier Subscriber
# ============================================

output "notifier_queue_url" {
  description = "URL of the notifier queue"
  value       = module.notifier.queue_url
}

output "notifier_dlq_url" {
  description = "URL of the notifier DLQ"
  value       = module.notifier.dlq_url
}

output "notifier_function_name" {
  description = "Name of the notifier Lambda"
  value       = module.notifier.lambda_function_name
}

# ============================================
# Quick Start
# ============================================

output "quick_start" {
  description = "Quick start commands"
  value       = <<-EOT

    # Publish an event (fan-out to all 3 subscribers)
    curl -X POST ${module.api.events_endpoint} \
      -H "Content-Type: application/json" \
      -d '{
        "eventType": "ReportRequested",
        "eventId": "evt-'$(uuidgen | tr '[:upper:]' '[:lower:]')'",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "data": {
          "reportId": "rpt-123",
          "userId": "user-456",
          "reportType": "monthly-summary"
        }
      }'

    # View PDF generator logs
    aws logs tail ${module.pdf_generator.log_group_name} --follow

    # View audit logger logs
    aws logs tail ${module.audit_logger.log_group_name} --follow

    # View notifier logs
    aws logs tail ${module.notifier.log_group_name} --follow

    # Check DLQs for failed messages
    aws sqs receive-message --queue-url ${module.pdf_generator.dlq_url}
    aws sqs receive-message --queue-url ${module.audit_logger.dlq_url}
    aws sqs receive-message --queue-url ${module.notifier.dlq_url}

  EOT
}
