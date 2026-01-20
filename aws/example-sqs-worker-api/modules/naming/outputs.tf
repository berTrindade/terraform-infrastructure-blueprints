# modules/naming/outputs.tf
# Naming module outputs
# Based on terraform-skill module-patterns (output best practices)

output "prefix" {
  description = "Base prefix for all resources ({project}-{environment})"
  value       = local.prefix
}

output "names" {
  description = "Map of all generated resource names"
  value       = local.names
}

output "api_gateway" {
  description = "Name for API Gateway"
  value       = local.names.api_gateway
}

output "api_role" {
  description = "Name for API Gateway IAM role"
  value       = local.names.api_role
}

output "dynamodb_table" {
  description = "Name for DynamoDB table"
  value       = local.names.dynamodb_table
}

output "sqs_queue" {
  description = "Name for SQS queue"
  value       = local.names.sqs_queue
}

output "sqs_dlq" {
  description = "Name for SQS dead-letter queue"
  value       = local.names.sqs_dlq
}

output "worker_lambda" {
  description = "Name for Worker Lambda"
  value       = local.names.worker_lambda
}

output "worker_role" {
  description = "Name for Worker Lambda IAM role"
  value       = local.names.worker_role
}

output "secret_prefix" {
  description = "Prefix for Secrets Manager secrets (/{env}/{app})"
  value       = local.names.secret_prefix
}

output "log_group_worker" {
  description = "CloudWatch log group name for Worker Lambda"
  value       = local.names.log_group_worker
}
