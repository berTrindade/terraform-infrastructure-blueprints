# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "api_gateway" {
  value = local.names.api_gateway
}

output "api_lambda" {
  value = local.names.api_lambda
}

output "user_pool" {
  value = local.names.user_pool
}

output "user_pool_client" {
  value = local.names.user_pool_client
}

output "dynamodb_table" {
  value = local.names.dynamodb_table
}

output "lambda_role" {
  value = local.names.lambda_role
}

output "log_group_api" {
  value = local.names.log_group_api
}
