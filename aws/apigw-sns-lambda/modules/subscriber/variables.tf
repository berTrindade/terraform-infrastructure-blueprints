# modules/subscriber/variables.tf
# Input variables for subscriber module

# ============================================
# Queue Configuration
# ============================================

variable "queue_name" {
  description = "Name of the SQS queue"
  type        = string
}

variable "dlq_name" {
  description = "Name of the dead-letter queue"
  type        = string
}

variable "message_retention_seconds" {
  description = "Message retention in main queue (seconds)"
  type        = number
  default     = 86400 # 1 day
}

variable "dlq_retention_seconds" {
  description = "Message retention in DLQ (seconds)"
  type        = number
  default     = 1209600 # 14 days
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout (should be > Lambda timeout)"
  type        = number
  default     = 60
}

variable "max_receive_count" {
  description = "Max receives before message goes to DLQ"
  type        = number
  default     = 3
}

# ============================================
# SNS Subscription Configuration
# ============================================

variable "sns_topic_arn" {
  description = "ARN of the SNS topic to subscribe to"
  type        = string
}

variable "raw_message_delivery" {
  description = "Enable raw message delivery (no SNS wrapper)"
  type        = bool
  default     = true
}

variable "filter_policy" {
  description = "SNS subscription filter policy (optional)"
  type        = map(any)
  default     = null
}

variable "filter_policy_scope" {
  description = "Scope for filter policy: MessageAttributes or MessageBody"
  type        = string
  default     = "MessageBody"
}

# ============================================
# Lambda Configuration
# ============================================

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "description" {
  description = "Description of the Lambda function"
  type        = string
  default     = "SNS subscriber consumer"
}

variable "role_name" {
  description = "Name of the IAM role for Lambda"
  type        = string
}

variable "source_dir" {
  description = "Path to Lambda source code directory"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size (MB)"
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Lambda timeout (seconds)"
  type        = number
  default     = 30
}

variable "reserved_concurrency" {
  description = "Reserved concurrent executions (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "environment_variables" {
  description = "Environment variables for Lambda"
  type        = map(string)
  default     = {}
}

variable "additional_policy_arns" {
  description = "Additional IAM policy ARNs to attach to Lambda role"
  type        = list(string)
  default     = []
}

# ============================================
# SQS Event Source Configuration
# ============================================

variable "batch_size" {
  description = "Max messages per Lambda invocation"
  type        = number
  default     = 10
}

variable "batching_window_seconds" {
  description = "Max wait time for batch to fill"
  type        = number
  default     = 0
}

variable "max_concurrency" {
  description = "Max concurrent Lambda invocations"
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
}

# ============================================
# Tags
# ============================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
