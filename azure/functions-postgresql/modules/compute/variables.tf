variable "function_app_name" {
  description = "Name of the Function App"
  type        = string
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "storage_account_name" {
  description = "Name of the storage account for Function App"
  type        = string
}

variable "storage_account_access_key" {
  description = "Access key for the storage account"
  type        = string
  sensitive   = true
}

variable "app_service_plan_tier" {
  description = "App Service Plan tier (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "app_service_plan_size" {
  description = "App Service Plan size (S1, S2, etc.)"
  type        = string
  default     = "S1"
}

variable "node_version" {
  description = "Node.js version"
  type        = string
  default     = "18"
}

variable "node_env" {
  description = "Node environment"
  type        = string
  default     = "production"
}

variable "db_host" {
  description = "PostgreSQL database host"
  type        = string
}

variable "db_port" {
  description = "PostgreSQL database port"
  type        = string
  default     = "5432"
}

variable "db_database" {
  description = "PostgreSQL database name"
  type        = string
}

variable "db_username" {
  description = "PostgreSQL database username"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "always_on" {
  description = "Enable always on for Function App"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 0
}

variable "log_disk_quota_mb" {
  description = "Log disk quota in MB"
  type        = number
  default     = 100
}

variable "additional_app_settings" {
  description = "Additional app settings for Function App"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
