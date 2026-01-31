# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "amplify_app" {
  value = local.names.amplify_app
}

output "user_pool" {
  value = local.names.user_pool
}

output "user_pool_client" {
  value = local.names.user_pool_client
}

output "identity_pool" {
  value = local.names.identity_pool
}

output "api" {
  value = local.names.api
}

output "lambda_function" {
  value = local.names.lambda_function
}

output "lambda_role" {
  value = local.names.lambda_role
}

output "lambda_log_group" {
  value = local.names.lambda_log_group
}
