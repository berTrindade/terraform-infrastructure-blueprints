# modules/queue/variables.tf
# Queue module input variables
# Based on terraform-skill code-patterns (variable ordering)

variable "queue_name" {
  description = "Name of the main SQS queue"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+$", var.queue_name))
    error_message = "Queue name must contain only alphanumeric characters, underscores, and hyphens."
  }
}

variable "dlq_name" {
  description = "Name of the dead-letter queue"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9_-]+$", var.dlq_name))
    error_message = "DLQ name must contain only alphanumeric characters, underscores, and hyphens."
  }
}

variable "message_retention_seconds" {
  description = "How long messages are retained in the main queue (seconds)"
  type        = number
  default     = 86400 # 1 day

  validation {
    condition     = var.message_retention_seconds >= 60 && var.message_retention_seconds <= 1209600
    error_message = "Message retention must be between 60 seconds and 14 days (1209600 seconds)."
  }
}

variable "dlq_retention_seconds" {
  description = "How long messages are retained in the DLQ (seconds)"
  type        = number
  default     = 1209600 # 14 days

  validation {
    condition     = var.dlq_retention_seconds >= 60 && var.dlq_retention_seconds <= 1209600
    error_message = "DLQ retention must be between 60 seconds and 14 days (1209600 seconds)."
  }
}

variable "visibility_timeout_seconds" {
  description = "How long a message is hidden after being received (should be > Lambda timeout)"
  type        = number
  default     = 60

  validation {
    condition     = var.visibility_timeout_seconds >= 0 && var.visibility_timeout_seconds <= 43200
    error_message = "Visibility timeout must be between 0 and 12 hours (43200 seconds)."
  }
}

variable "delay_seconds" {
  description = "Delay before a message becomes visible after being sent"
  type        = number
  default     = 0

  validation {
    condition     = var.delay_seconds >= 0 && var.delay_seconds <= 900
    error_message = "Delay must be between 0 and 15 minutes (900 seconds)."
  }
}

variable "max_receive_count" {
  description = "Number of times a message can be received before being sent to DLQ"
  type        = number
  default     = 3

  validation {
    condition     = var.max_receive_count >= 1 && var.max_receive_count <= 1000
    error_message = "Max receive count must be between 1 and 1000."
  }
}

variable "tags" {
  description = "Tags to apply to all queue resources"
  type        = map(string)
  default     = {}
}
