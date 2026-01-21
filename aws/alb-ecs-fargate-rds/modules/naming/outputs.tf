# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "vpc" {
  value = local.names.vpc
}

output "public_subnet" {
  value = local.names.public_subnet
}

output "private_subnet" {
  value = local.names.private_subnet
}

output "security_group" {
  value = local.names.security_group
}

output "ecs_cluster" {
  value = local.names.ecs_cluster
}

output "ecs_service" {
  value = local.names.ecs_service
}

output "task_definition" {
  value = local.names.task_definition
}

output "alb" {
  value = local.names.alb
}

output "target_group" {
  value = local.names.target_group
}

output "ecr_repository" {
  value = local.names.ecr_repository
}

output "task_role" {
  value = local.names.task_role
}

output "execution_role" {
  value = local.names.execution_role
}

output "log_group" {
  value = local.names.log_group
}

output "db_instance" {
  value = local.names.db_instance
}

output "db_secret" {
  description = "Database credentials secret name (/{env}/{app}/db-credentials format)"
  value       = local.names.db_secret
}

output "secret_prefix" {
  description = "Secret prefix for additional secrets (/{env}/{app} format)"
  value       = local.names.secret_prefix
}
