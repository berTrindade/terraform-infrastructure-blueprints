# environments/dev/outputs.tf
# Development environment outputs (API Gateway → EventBridge → Consumers)
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
# EventBridge
# ============================================

output "event_bus_arn" {
  description = "ARN of the EventBridge event bus"
  value       = module.event_bus.bus_arn
}

output "event_bus_name" {
  description = "Name of the EventBridge event bus"
  value       = module.event_bus.bus_name
}

output "archive_arn" {
  description = "ARN of the event archive (if enabled)"
  value       = module.event_bus.archive_arn
}

# ============================================
# PDF Generator Consumer
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

output "pdf_generator_rule_arn" {
  description = "ARN of the PDF generator EventBridge rule"
  value       = module.pdf_generator_rule.rule_arn
}

# ============================================
# Audit Logger Consumer
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

output "audit_logger_rule_arn" {
  description = "ARN of the audit logger EventBridge rule"
  value       = module.audit_logger_rule.rule_arn
}

# ============================================
# Notifier Consumer
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

output "notifier_rule_arn" {
  description = "ARN of the notifier EventBridge rule"
  value       = module.notifier_rule.rule_arn
}

# ============================================
# Quick Start
# ============================================

output "quick_start" {
  description = "Quick start commands"
  value       = <<-EOT

    # Put an event to EventBridge (routes to all matching consumers)
    curl -X POST ${module.api.events_endpoint} \
      -H "Content-Type: application/json" \
      -d '{
        "detailType": "ReportRequested",
        "detail": "{\"eventId\":\"evt-test-001\",\"reportId\":\"rpt-123\",\"userId\":\"user-456\",\"reportType\":\"monthly-summary\"}"
      }'

    # View PDF generator logs
    aws logs tail ${module.pdf_generator.log_group_name} --follow

    # View audit logger logs
    aws logs tail ${module.audit_logger.log_group_name} --follow

    # View notifier logs
    aws logs tail ${module.notifier.log_group_name} --follow

    # List EventBridge rules
    aws events list-rules --event-bus-name ${module.event_bus.bus_name}

    # View archived events (if archiving enabled)
    aws events list-archives

    # Check DLQs for failed messages
    aws sqs receive-message --queue-url ${module.pdf_generator.dlq_url}
    aws sqs receive-message --queue-url ${module.audit_logger.dlq_url}
    aws sqs receive-message --queue-url ${module.notifier.dlq_url}

  EOT
}
