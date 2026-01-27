output "function_app_id" {
  description = "ID of the Function App"
  value       = azurerm_linux_function_app.this.id
}

output "function_app_name" {
  description = "Name of the Function App"
  value       = azurerm_linux_function_app.this.name
}

output "function_app_default_hostname" {
  description = "Default hostname of the Function App"
  value       = azurerm_linux_function_app.this.default_hostname
}

output "app_service_plan_id" {
  description = "ID of the App Service Plan"
  value       = azurerm_app_service_plan.this.id
}
