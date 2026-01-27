variable "log_analytics_workspace_name" {
  description = "Name of the Log Analytics Workspace"
  type        = string
}

variable "application_insights_name" {
  description = "Name of the Application Insights instance"
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

variable "log_analytics_sku" {
  description = "Log Analytics SKU (PerGB2018, Free, etc.)"
  type        = string
  default     = "PerGB2018"
}

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 90
}

variable "application_type" {
  description = "Application type (web, other, Node.JS, etc.)"
  type        = string
  default     = "Node.JS"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
