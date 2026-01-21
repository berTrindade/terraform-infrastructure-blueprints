# modules/worker/variables.tf
# Worker module input variables
# Based on terraform-skill code-patterns (variable ordering)

# ----------------------------------------
# Lambda configuration
# ----------------------------------------

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "role_name" {
  description = "Name of the IAM role for the Lambda function"
  type        = string
}

variable "log_group_name" {
  description = "Name of the CloudWatch log group for Lambda"
  type        = string
}

variable "source_dir" {
  description = "Path to the Lambda source code directory"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256

  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 MB and 10240 MB."
  }
}

variable "timeout" {
  description = "Lambda timeout in seconds (should be < SQS visibility timeout)"
  type        = number
  default     = 30

  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

variable "reserved_concurrency" {
  description = "Reserved concurrent executions (-1 for no limit)"
  type        = number
  default     = -1

  validation {
    condition     = var.reserved_concurrency >= -1
    error_message = "Reserved concurrency must be -1 (no limit) or a positive number."
  }
}

# ----------------------------------------
# SQS Event Source configuration
# ----------------------------------------

variable "sqs_queue_arn" {
  description = "ARN of the SQS queue to process"
  type        = string
}

variable "batch_size" {
  description = "Maximum number of messages to process per invocation"
  type        = number
  default     = 10

  validation {
    condition     = var.batch_size >= 1 && var.batch_size <= 10000
    error_message = "Batch size must be between 1 and 10000."
  }
}

variable "batching_window_seconds" {
  description = "Maximum time to wait for batch to fill (seconds)"
  type        = number
  default     = 0

  validation {
    condition     = var.batching_window_seconds >= 0 && var.batching_window_seconds <= 300
    error_message = "Batching window must be between 0 and 300 seconds."
  }
}

variable "max_concurrency" {
  description = "Maximum concurrent Lambda invocations for this event source"
  type        = number
  default     = 10

  validation {
    condition     = var.max_concurrency >= 2 && var.max_concurrency <= 1000
    error_message = "Max concurrency must be between 2 and 1000."
  }
}

# ----------------------------------------
# Integration: DynamoDB
# ----------------------------------------

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for command storage"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table (for IAM policy)"
  type        = string
}

# ----------------------------------------
# Integration: Secrets Manager (optional)
# ----------------------------------------

variable "secret_arns" {
  description = "List of Secrets Manager ARNs the Lambda can access"
  type        = list(string)
  default     = []
}

variable "external_api_secret_arn" {
  description = "ARN of the external API secret (passed to Lambda env var)"
  type        = string
  default     = null
}

# ----------------------------------------
# Observability
# ----------------------------------------

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention value."
  }
}

# ----------------------------------------
# Tags
# ----------------------------------------

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
