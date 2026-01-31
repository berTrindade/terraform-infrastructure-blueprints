# modules/data/variables.tf
# Aurora Serverless v2 variables - Flow A (TF-Generated Password)

variable "cluster_identifier" {
  description = "Identifier for the Aurora cluster"
  type        = string
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "app"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = <<-EOT
    Database master password (ephemeral, write-only).
    This should be an ephemeral value - it will be sent to Aurora but never stored in state.
  EOT
  type        = string
  sensitive   = true
  ephemeral   = true
}

variable "db_password_version" {
  description = <<-EOT
    Password version for rotation.
    Increment this value to rotate the database password.
    
    Example:
      - Initial deploy: db_password_version = 1
      - First rotation: db_password_version = 2
  EOT
  type        = number
  default     = 1
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 1
}

# ============================================
# Serverless v2 Scaling Configuration
# ============================================

variable "min_capacity" {
  description = "Minimum ACU capacity (0.5 - 128)"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum ACU capacity (0.5 - 128)"
  type        = number
  default     = 4
}

# ============================================
# Network Configuration
# ============================================

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for Aurora"
  type        = string
}

# ============================================
# Backup and Recovery
# ============================================

variable "backup_retention_period" {
  description = "Days to retain backups"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = true
}

# ============================================
# Monitoring
# ============================================

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
