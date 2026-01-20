# modules/data/variables.tf
# Input variables for RDS data module

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

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

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

variable "security_group_id" {
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
