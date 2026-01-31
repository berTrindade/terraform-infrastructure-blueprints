variable "project" {
  description = "Project name (lowercase, alphanumeric, hyphens)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens only."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Central US"
}

variable "repository" {
  description = "Repository URL or name"
  type        = string
  default     = ""
}

variable "postgresql_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "postgresql_version" {
  description = "PostgreSQL version (11, 12, 13, 14, 15)"
  type        = string
  default     = "12"
}

variable "postgresql_sku" {
  description = "PostgreSQL SKU (e.g., B_Standard_B1ms)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgresql_storage_mb" {
  description = "PostgreSQL storage size in MB"
  type        = number
  default     = 32768
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

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "additional_app_settings" {
  description = "Additional app settings for Function App"
  type        = map(string)
  default     = {}
}
