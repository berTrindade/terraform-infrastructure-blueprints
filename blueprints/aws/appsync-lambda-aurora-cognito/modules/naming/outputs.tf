# modules/naming/outputs.tf
# Output values for naming module

output "prefix" {
  description = "Base prefix for all resources"
  value       = local.prefix
}

output "appsync_api" {
  description = "AppSync GraphQL API name"
  value       = local.names.appsync_api
}

output "lambda_resolver" {
  description = "Lambda resolver function name"
  value       = local.names.lambda_resolver
}

output "vpc" {
  description = "VPC name"
  value       = local.names.vpc
}

output "private_subnet" {
  description = "Private subnet name prefix"
  value       = local.names.private_subnet
}

output "security_group" {
  description = "Security group name prefix"
  value       = local.names.security_group
}

output "db_subnet_group" {
  description = "DB subnet group name"
  value       = local.names.db_subnet_group
}

output "aurora_cluster" {
  description = "Aurora cluster name"
  value       = local.names.aurora_cluster
}

output "aurora_identifier" {
  description = "Aurora cluster identifier"
  value       = local.names.aurora_identifier
}

output "cognito_user_pool" {
  description = "Cognito User Pool name"
  value       = local.names.cognito_user_pool
}

output "cognito_client" {
  description = "Cognito User Pool Client name"
  value       = local.names.cognito_client
}

output "secret_prefix" {
  description = "Secrets Manager prefix"
  value       = local.names.secret_prefix
}

output "db_secret" {
  description = "Database credentials secret name"
  value       = local.names.db_secret
}

output "appsync_role" {
  description = "AppSync IAM role name"
  value       = local.names.appsync_role
}

output "lambda_role" {
  description = "Lambda IAM role name"
  value       = local.names.lambda_role
}

output "log_group_lambda" {
  description = "CloudWatch log group for Lambda resolver"
  value       = local.names.log_group_lambda
}
