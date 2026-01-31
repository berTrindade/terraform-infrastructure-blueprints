# modules/data/variables.tf
# RDS + Proxy variables - AWS-Managed Master Password

# ============================================
# RDS Configuration
# ============================================

variable "db_identifier" {
  description = "Identifier for the RDS instance"
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

# Note: No db_password variable
# Password is managed by RDS via manage_master_user_password

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Initial storage allocation in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
}

variable "rds_security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Days to retain backups"
  type        = number
  default     = 7
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval (0 to disable)"
  type        = number
  default     = 0
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
# RDS Proxy Configuration
# ============================================

variable "proxy_name" {
  description = "Name for the RDS Proxy"
  type        = string
}

variable "proxy_role_name" {
  description = "Name for the RDS Proxy IAM role"
  type        = string
}

variable "proxy_security_group_id" {
  description = "Security group ID for RDS Proxy"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for RDS Proxy"
  type        = list(string)
}

# Note: No db_secret_arn variable
# Proxy uses the RDS-managed secret automatically

variable "proxy_debug_logging" {
  description = "Enable debug logging for RDS Proxy"
  type        = bool
  default     = false
}

variable "proxy_idle_timeout" {
  description = "Idle client timeout in seconds"
  type        = number
  default     = 1800
}

variable "proxy_connection_borrow_timeout" {
  description = "Connection borrow timeout in seconds"
  type        = number
  default     = 120
}

variable "proxy_max_connections_percent" {
  description = "Maximum connections percent"
  type        = number
  default     = 100
}

variable "proxy_max_idle_connections_percent" {
  description = "Maximum idle connections percent"
  type        = number
  default     = 50
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
