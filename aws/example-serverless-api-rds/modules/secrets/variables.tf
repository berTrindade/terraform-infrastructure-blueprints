# modules/secrets/variables.tf
# Input variables for secrets module

variable "secret_name" {
  description = "Name for the secret in Secrets Manager"
  type        = string
}

variable "db_identifier" {
  description = "Database identifier for description"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "app"
}

variable "db_host" {
  description = "Database host endpoint"
  type        = string
  default     = ""
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "recovery_window_in_days" {
  description = "Days before deleted secret is permanently removed"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
