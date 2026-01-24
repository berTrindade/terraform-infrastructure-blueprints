# environments/dev/variables.tf
# Development environment input variables

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
# Cognito Configuration
# ============================================

variable "cognito_password_minimum_length" {
  description = "Minimum password length for Cognito"
  type        = number
  default     = 8
}

variable "cognito_mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OFF"
}

variable "cognito_access_token_validity" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "cognito_id_token_validity" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "cognito_refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "cognito_callback_urls" {
  description = "Callback URLs for Cognito hosted UI"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  description = "Logout URLs for Cognito hosted UI"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "cognito_create_domain" {
  description = "Create Cognito domain for hosted UI"
  type        = bool
  default     = false
}

variable "cognito_domain_prefix" {
  description = "Domain prefix for Cognito hosted UI (must be unique globally)"
  type        = string
  default     = null
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
# Aurora Serverless v2 Configuration
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

variable "db_password_version" {
  description = <<-EOT
    Password version for rotation (Flow A).
    Increment this value to rotate the database password.
    
    Example:
      - Initial deploy: db_password_version = 1
      - First rotation: db_password_version = 2
  EOT
  type        = number
  default     = 1
}

variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 1
}

variable "aurora_min_capacity" {
  description = "Minimum ACU capacity (0.5 - 128)"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Maximum ACU capacity (0.5 - 128)"
  type        = number
  default     = 4
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

# ============================================
# AppSync Configuration
# ============================================

variable "appsync_log_level" {
  description = "CloudWatch log level (NONE, ERROR, ALL)"
  type        = string
  default     = "ALL"
}

variable "appsync_xray_enabled" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

variable "appsync_create_api_key" {
  description = "Create an API key for testing/development"
  type        = bool
  default     = true
}

variable "appsync_api_key_expires" {
  description = "API key expiration date (RFC3339 format)"
  type        = string
  default     = null
}

# ============================================
# Observability
# ============================================

variable "log_retention_days" {
  description = "CloudWatch log retention (days)"
  type        = number
  default     = 14
}
