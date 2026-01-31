# environments/dev/variables.tf
# Development environment input variables (API Gateway → EventBridge → Consumers)
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
# EventBridge Configuration
# ============================================

variable "event_source" {
  description = "Source identifier for events"
  type        = string
  default     = "reports.api"
}

variable "enable_archive" {
  description = "Enable event archiving for replay"
  type        = bool
  default     = true
}

variable "archive_retention_days" {
  description = "Days to retain archived events (0 = indefinite)"
  type        = number
  default     = 7
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
# SQS Configuration (shared by all consumers)
# ============================================

variable "sqs_retention_seconds" {
  description = "Message retention in consumer queues (seconds)"
  type        = number
  default     = 86400 # 1 day

  validation {
    condition     = var.sqs_retention_seconds >= 60 && var.sqs_retention_seconds <= 1209600
    error_message = "SQS retention must be between 60 seconds and 14 days (1209600 seconds)."
  }
}

variable "dlq_retention_seconds" {
  description = "Message retention in DLQs (seconds)"
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
# Consumer Lambda Configuration (shared)
# ============================================

variable "consumer_memory_size" {
  description = "Consumer Lambda memory (MB)"
  type        = number
  default     = 256

  validation {
    condition     = var.consumer_memory_size >= 128 && var.consumer_memory_size <= 10240
    error_message = "Consumer memory size must be between 128 MB and 10240 MB."
  }
}

variable "consumer_timeout" {
  description = "Consumer Lambda timeout (seconds)"
  type        = number
  default     = 30

  validation {
    condition     = var.consumer_timeout >= 1 && var.consumer_timeout <= 900
    error_message = "Consumer timeout must be between 1 and 900 seconds."
  }
}

variable "consumer_batch_size" {
  description = "Max messages per consumer Lambda invocation"
  type        = number
  default     = 10
}

variable "consumer_batching_window_seconds" {
  description = "Max wait time for batch to fill"
  type        = number
  default     = 0
}

variable "consumer_max_concurrency" {
  description = "Max concurrent consumer Lambda invocations"
  type        = number
  default     = 10
}

# ============================================
# Notifier Configuration
# ============================================

variable "notifier_event_pattern" {
  description = "EventBridge event pattern for notifier (JSON string, null for default)"
  type        = string
  default     = null
}

variable "notification_webhook" {
  description = "Webhook URL for notifications (optional)"
  type        = string
  default     = ""
}

variable "slack_webhook" {
  description = "Slack webhook URL (optional)"
  type        = string
  default     = ""
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
