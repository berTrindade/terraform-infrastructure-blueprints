# environments/dev/outputs.tf

output "api_endpoint" {
  value = module.api.api_endpoint
}

output "items_endpoint" {
  value = module.api.items_endpoint
}

output "user_pool_id" {
  value = module.auth.user_pool_id
}

output "user_pool_client_id" {
  value = module.auth.user_pool_client_id
}

output "cognito_issuer_url" {
  value = module.auth.issuer_url
}

output "dynamodb_table_name" {
  value = module.data.table_name
}

output "lambda_function_name" {
  value = module.api.lambda_function_name
}
