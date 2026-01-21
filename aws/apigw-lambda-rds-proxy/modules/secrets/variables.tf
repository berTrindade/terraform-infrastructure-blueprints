# modules/secrets/variables.tf
# Secrets Manager module variables - AWS-Managed Master Password

variable "secret_name" {
  description = "Name of the metadata secret. Use /{env}/{app}/db-metadata format."
  type        = string
}

variable "db_identifier" {
  description = "RDS instance identifier for documentation"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_host" {
  description = "RDS database host endpoint"
  type        = string
}

variable "proxy_host" {
  description = "RDS Proxy endpoint (for application connections)"
  type        = string
  default     = ""
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "app"
}

variable "recovery_window_in_days" {
  description = "Number of days to retain deleted secret (7-30 for production)"
  type        = number
  default     = 7

  validation {
    condition     = var.recovery_window_in_days >= 0 && var.recovery_window_in_days <= 30
    error_message = "Recovery window must be between 0 and 30 days"
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
