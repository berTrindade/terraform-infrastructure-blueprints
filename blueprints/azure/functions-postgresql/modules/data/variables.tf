variable "server_name" {
  description = "Name of the PostgreSQL Flexible Server"
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

variable "postgresql_version" {
  description = "PostgreSQL version (11, 12, 13, 14, 15)"
  type        = string
  default     = "12"
}

variable "zone" {
  description = "Availability zone (1, 2, 3)"
  type        = number
  default     = 2
}

variable "administrator_login" {
  description = "PostgreSQL administrator username"
  type        = string
}

variable "administrator_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

variable "storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 32768
}

variable "sku_name" {
  description = "SKU name (e.g., B_Standard_B1ms)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "database_name" {
  description = "Name of the database"
  type        = string
}

variable "collation" {
  description = "Database collation"
  type        = string
  default     = "en_US.utf8"
}

variable "charset" {
  description = "Database charset"
  type        = string
  default     = "utf8"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
