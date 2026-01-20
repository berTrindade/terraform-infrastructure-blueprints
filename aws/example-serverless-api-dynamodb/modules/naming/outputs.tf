# modules/naming/outputs.tf

output "prefix" {
  description = "Base prefix for all resources"
  value       = local.prefix
}

output "api_gateway" {
  description = "API Gateway name"
  value       = local.names.api_gateway
}

output "api_lambda" {
  description = "API Lambda function name"
  value       = local.names.api_lambda
}

output "dynamodb_table" {
  description = "DynamoDB table name"
  value       = local.names.dynamodb_table
}

output "lambda_role" {
  description = "Lambda IAM role name"
  value       = local.names.lambda_role
}

output "log_group_api" {
  description = "CloudWatch log group for API Lambda"
  value       = local.names.log_group_api
}
