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

output "api_lambda" {
  description = "API Lambda function name"
  value       = local.names.api_lambda
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

output "rds_instance" {
  description = "RDS instance name"
  value       = local.names.rds_instance
}

output "rds_identifier" {
  description = "RDS identifier"
  value       = local.names.rds_identifier
}

output "rds_proxy" {
  description = "RDS Proxy name"
  value       = local.names.rds_proxy
}

output "secret_prefix" {
  description = "Secrets Manager prefix"
  value       = local.names.secret_prefix
}

output "db_secret" {
  description = "Database credentials secret name"
  value       = local.names.db_secret
}

output "api_role" {
  description = "API IAM role name"
  value       = local.names.api_role
}

output "lambda_role" {
  description = "Lambda IAM role name"
  value       = local.names.lambda_role
}

output "proxy_role" {
  description = "RDS Proxy IAM role name"
  value       = local.names.proxy_role
}

output "log_group_api" {
  description = "CloudWatch log group for API Lambda"
  value       = local.names.log_group_api
}
