# environments/dev/variables.tf
# Development environment input variables
# Based on terraform-skill code-patterns (variable ordering)

# ============================================
# Project Configuration
# ============================================

variable "project" {
  description = "Project name used in resource naming"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
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

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "repository" {
  description = "Source repository for tagging"
  type        = string
  default     = "terraform-infra-blueprints"
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ============================================
# VPC Configuration
# ============================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# ============================================
# Secrets Configuration
# ============================================

variable "secrets_recovery_window_days" {
  description = "Days before deleted secrets are permanently removed"
  type        = number
  default     = 7
}

# ============================================
# RDS Configuration
# ============================================

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

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial storage allocation in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "db_backup_retention_period" {
  description = "Days to retain backups"
  type        = number
  default     = 7
}

variable "db_performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = true
}

variable "db_apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = true
}

# ============================================
# RDS Proxy Configuration
# ============================================

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

# ============================================
# Lambda Configuration
# ============================================

variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

# ============================================
# Observability
# ============================================

variable "log_retention_days" {
  description = "CloudWatch log retention (days)"
  type        = number
  default     = 14
}
