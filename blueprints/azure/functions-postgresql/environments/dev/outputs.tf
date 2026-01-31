output "resource_group_name" {
  description = "Name of the resource group"
  value       = module.networking.resource_group_name
}

output "function_app_name" {
  description = "Name of the Function App"
  value       = module.compute.function_app_name
}

output "function_app_url" {
  description = "URL of the Function App"
  value       = "https://${module.compute.function_app_default_hostname}"
}

output "postgresql_server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL server"
  value       = module.data.server_fqdn
}

output "postgresql_database_name" {
  description = "Name of the PostgreSQL database"
  value       = module.data.database_name
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "application_insights_app_id" {
  description = "Application Insights App ID"
  value       = module.monitoring.application_insights_app_id
}
