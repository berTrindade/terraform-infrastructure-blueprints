# environments/dev/outputs.tf
# Output values for the development environment

# ============================================
# API Outputs
# ============================================

output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "items_endpoint" {
  description = "Full URL for items endpoint"
  value       = "${module.api_gateway.api_endpoint}/items"
}

# ============================================
# Lambda Outputs
# ============================================

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.api_lambda.lambda_function_name
}

output "lambda_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = module.api_lambda.cloudwatch_log_group_name
}

# ============================================
# Database Outputs
# ============================================

output "db_endpoint" {
  description = "RDS endpoint (direct, not through proxy)"
  value       = module.data.db_endpoint
}

output "proxy_endpoint" {
  description = "RDS Proxy endpoint (Lambda connects here)"
  value       = module.data.proxy_endpoint
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
