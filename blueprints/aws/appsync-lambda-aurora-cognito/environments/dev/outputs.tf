# environments/dev/outputs.tf
# Output values for the development environment

# ============================================
# AppSync API Outputs
# ============================================

output "appsync_api_id" {
  description = "ID of the AppSync GraphQL API"
  value       = module.api.api_id
}

output "appsync_graphql_endpoint" {
  description = "GraphQL endpoint URL"
  value       = module.api.api_uris.graphql
}

output "appsync_realtime_endpoint" {
  description = "Realtime endpoint URL"
  value       = module.api.api_uris.realtime
}

output "appsync_api_key" {
  description = "API key for testing (if created)"
  value       = module.api.api_key
  sensitive   = true
}

# ============================================
# Cognito Outputs
# ============================================

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.auth.user_pool_client_id
}

output "cognito_user_pool_domain" {
  description = "Cognito domain (if created)"
  value       = module.auth.user_pool_domain
}

output "cognito_issuer_url" {
  description = "Issuer URL for JWT validation"
  value       = module.auth.issuer_url
}

# ============================================
# Lambda Outputs
# ============================================

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.compute.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = module.compute.function_arn
}

output "lambda_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = module.naming.log_group_lambda
}

# ============================================
# Database Outputs
# ============================================

output "aurora_cluster_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = module.data.cluster_endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = module.data.cluster_reader_endpoint
}

output "db_name" {
  description = "Database name"
  value       = module.data.db_name
}

# ============================================
# Secrets Outputs
# ============================================

output "db_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = module.secrets.secret_arn
}

output "db_secret_name" {
  description = "Name of the database credentials secret"
  value       = module.secrets.secret_name
}

# ============================================
# VPC Outputs
# ============================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}
