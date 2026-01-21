# environments/dev/outputs.tf
# Development environment outputs (API Gateway → SQS → Worker)
# Based on terraform-skill module-patterns (output best practices)

# ============================================
# API Gateway
# ============================================

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_endpoint
}

output "commands_endpoint" {
  description = "Full URL for POST /commands"
  value       = "${module.api.api_endpoint}/commands"
}

# ============================================
# DynamoDB
# ============================================

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.data.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = module.data.table_arn
}

# ============================================
# SQS
# ============================================

output "sqs_queue_url" {
  description = "URL of the main SQS queue"
  value       = module.queue.queue_url
}

output "sqs_queue_arn" {
  description = "ARN of the main SQS queue"
  value       = module.queue.queue_arn
}

output "sqs_dlq_url" {
  description = "URL of the dead-letter queue"
  value       = module.queue.dlq_url
}

# ============================================
# Lambda Functions
# ============================================

output "worker_function_name" {
  description = "Name of the Worker Lambda"
  value       = module.worker.lambda_function_name
}

# ============================================
# Secrets Manager
# ============================================

output "secret_arns" {
  description = "Map of secret names to ARNs"
  value       = module.secrets.secret_arns
}

output "secret_names" {
  description = "Map of secret keys to full names"
  value       = module.secrets.secret_names
}

# ============================================
# Quick Start
# ============================================

output "quick_start" {
  description = "Quick start commands"
  value       = <<-EOT

    # Test the API (returns SQS message ID)
    curl -X POST ${module.api.api_endpoint}/commands \
      -H "Content-Type: application/json" \
      -d '{"input": {"message": "Hello, World!"}}'

    # Response will include SQS MessageId
    # Worker creates DynamoDB record and processes asynchronously

    # Seed secrets (if configured)
    cd ../../ && node scripts/secrets.js seed

    # View worker logs
    aws logs tail ${module.worker.log_group_name} --follow

    # Check DynamoDB for processed commands
    aws dynamodb scan --table-name ${module.data.table_name}

  EOT
}
