# modules/naming/outputs.tf
# Output values for naming module

output "prefix" {
  description = "Base prefix for all resources"
  value       = local.prefix
}

output "api_gateway" {
  description = "API Gateway name"
  value       = local.names.api_gateway
}

output "api_role" {
  description = "API Gateway IAM role name"
  value       = local.names.api_role
}

output "sns_topic" {
  description = "SNS topic name"
  value       = local.names.sns_topic
}

output "log_group_api" {
  description = "CloudWatch log group for API Gateway"
  value       = local.names.log_group_api
}

# Dynamic subscriber naming function
output "subscriber_queue" {
  description = "Function to generate subscriber queue name"
  value       = "${local.prefix}-subscriber"
}

output "subscriber_dlq" {
  description = "Function to generate subscriber DLQ name"
  value       = "${local.prefix}-subscriber-dlq"
}

output "subscriber_lambda" {
  description = "Function to generate subscriber Lambda name"
  value       = "${local.prefix}-subscriber"
}

output "subscriber_role" {
  description = "Function to generate subscriber role name"
  value       = "${local.prefix}-subscriber-role"
}
