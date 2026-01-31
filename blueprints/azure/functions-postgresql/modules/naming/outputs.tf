output "prefix" {
  description = "Base prefix for all resources"
  value       = local.prefix
}

output "function_app" {
  description = "Function App name"
  value       = local.names.function_app
}

output "app_service_plan" {
  description = "App Service Plan name"
  value       = local.names.app_service_plan
}

output "postgresql_server" {
  description = "PostgreSQL server name"
  value       = local.names.postgresql_server
}

output "postgresql_db" {
  description = "PostgreSQL database name"
  value       = local.names.postgresql_db
}

output "storage_account" {
  description = "Storage Account name"
  value       = local.names.storage_account
}

output "log_analytics_workspace" {
  description = "Log Analytics Workspace name"
  value       = local.names.log_analytics_workspace
}

output "application_insights" {
  description = "Application Insights name"
  value       = local.names.application_insights
}

output "resource_group" {
  description = "Resource Group name"
  value       = local.names.resource_group
}
