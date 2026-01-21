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

output "event_bus" {
  description = "EventBridge event bus name"
  value       = local.names.event_bus
}

output "archive" {
  description = "EventBridge archive name"
  value       = local.names.archive
}

output "log_group_api" {
  description = "CloudWatch log group for API Gateway"
  value       = local.names.log_group_api
}
