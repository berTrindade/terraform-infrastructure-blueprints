# environments/dev/variables.tf
# Development environment input variables (API Gateway → SQS → Worker)
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
# Secrets Configuration (Flow B)
# ============================================

variable "secrets" {
  description = "Map of secrets to create in Secrets Manager"
  type = map(object({
    description = string
  }))
  default = {}
}

variable "secrets_recovery_window_days" {
  description = "Days before deleted secrets are permanently removed"
  type        = number
  default     = 7
}

# ============================================
# DynamoDB Configuration
# ============================================

variable "enable_dynamodb_pitr" {
  description = "Enable point-in-time recovery for DynamoDB"
  type        = bool
  default     = true
}

variable "dynamodb_ttl_attribute" {
  description = "TTL attribute name (null to disable)"
  type        = string
  default     = null
}

# ============================================
# SQS Configuration
# ============================================

variable "sqs_retention_seconds" {
  description = "Message retention in main queue (seconds)"
  type        = number
  default     = 86400 # 1 day

  validation {
    condition     = var.sqs_retention_seconds >= 60 && var.sqs_retention_seconds <= 1209600
    error_message = "SQS retention must be between 60 seconds and 14 days (1209600 seconds)."
  }
}

variable "dlq_retention_seconds" {
  description = "Message retention in DLQ (seconds)"
  type        = number
  default     = 1209600 # 14 days
}

variable "sqs_visibility_timeout_seconds" {
  description = "Visibility timeout (should be > Lambda timeout)"
  type        = number
  default     = 60
}

variable "sqs_max_receive_count" {
  description = "Max receives before message goes to DLQ"
  type        = number
  default     = 3
}

# ============================================
# API Gateway Configuration
# ============================================

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

# ============================================
# Worker Lambda Configuration
# ============================================

variable "worker_memory_size" {
  description = "Worker Lambda memory (MB)"
  type        = number
  default     = 256

  validation {
    condition     = var.worker_memory_size >= 128 && var.worker_memory_size <= 10240
    error_message = "Worker memory size must be between 128 MB and 10240 MB."
  }
}

variable "worker_timeout" {
  description = "Worker Lambda timeout (seconds)"
  type        = number
  default     = 30

  validation {
    condition     = var.worker_timeout >= 1 && var.worker_timeout <= 900
    error_message = "Worker timeout must be between 1 and 900 seconds."
  }
}

variable "worker_batch_size" {
  description = "Max messages per Worker invocation"
  type        = number
  default     = 10
}

variable "worker_batching_window_seconds" {
  description = "Max wait time for batch to fill"
  type        = number
  default     = 0
}

variable "worker_max_concurrency" {
  description = "Max concurrent Worker invocations"
  type        = number
  default     = 10
}

# ============================================
# Observability
# ============================================

variable "log_retention_days" {
  description = "CloudWatch log retention (days)"
  type        = number
  default     = 14

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention value."
  }
}
