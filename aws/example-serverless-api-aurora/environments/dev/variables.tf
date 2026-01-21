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

# ============================================
# API Routes Configuration
# ============================================
# Define your API routes here - similar to serverless.yml
# Add new routes by adding entries to this map

variable "api_routes" {
  description = "API route configuration - declarative like serverless.yml. Add new routes here."
  type = map(object({
    method      = string
    path        = string
    description = optional(string, "")
  }))

  default = {
    list_items = {
      method      = "GET"
      path        = "/items"
      description = "List all items"
    }
    create_item = {
      method      = "POST"
      path        = "/items"
      description = "Create a new item"
    }
    get_item = {
      method      = "GET"
      path        = "/items/{id}"
      description = "Get item by ID"
    }
    update_item = {
      method      = "PUT"
      path        = "/items/{id}"
      description = "Update item by ID"
    }
    delete_item = {
      method      = "DELETE"
      path        = "/items/{id}"
      description = "Delete item by ID"
    }
  }

  validation {
    condition = alltrue([
      for k, v in var.api_routes : contains(["GET", "POST", "PUT", "DELETE", "PATCH", "ANY"], v.method)
    ])
    error_message = "Route method must be one of: GET, POST, PUT, DELETE, PATCH, ANY."
  }

  validation {
    condition = alltrue([
      for k, v in var.api_routes : startswith(v.path, "/")
    ])
    error_message = "Route path must start with /."
  }
}
