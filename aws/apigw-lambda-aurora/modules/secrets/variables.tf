# modules/secrets/variables.tf
# Secrets Manager module variables - Flow A (TF-Generated)

variable "secret_name" {
  description = "Name of the Secrets Manager secret. Use /{env}/{app}/db-credentials format."
  type        = string
}

variable "db_identifier" {
  description = "Aurora cluster identifier for documentation"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_host" {
  description = "Database host endpoint"
  type        = string
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
