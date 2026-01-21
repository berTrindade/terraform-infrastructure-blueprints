# environments/dev/outputs.tf

output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = module.api.api_endpoint
}

output "items_endpoint" {
  description = "Full URL for items endpoint"
  value       = module.api.items_endpoint
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.api.lambda_function_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.data.table_name
}

output "lambda_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = module.api.lambda_log_group
}
