# environments/dev/outputs.tf

output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "items_endpoint" {
  description = "Full URL for items endpoint"
  value       = "${module.api_gateway.api_endpoint}/items"
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.auth.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.auth.user_pool_client_id
}

output "cognito_issuer_url" {
  description = "Cognito JWT Issuer URL"
  value       = module.auth.issuer_url
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.data.table_name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.api_lambda.lambda_function_name
}
