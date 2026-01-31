# modules/rule/variables.tf
# Input variables for EventBridge rule module

variable "rule_name" {
  description = "Name of the EventBridge rule"
  type        = string
}

variable "description" {
  description = "Description of the rule"
  type        = string
  default     = "EventBridge routing rule"
}

variable "event_bus_name" {
  description = "Name of the event bus"
  type        = string
}

variable "event_pattern" {
  description = "JSON event pattern for filtering"
  type        = string
}

variable "enabled" {
  description = "Whether the rule is enabled"
  type        = bool
  default     = true
}

# Target configuration
variable "target_id" {
  description = "Target identifier"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the target SQS queue"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the target SQS queue"
  type        = string
}

# Optional: Input transformation
variable "input_paths" {
  description = "Map of JSON paths for input transformer"
  type        = map(string)
  default     = null
}

variable "input_template" {
  description = "Input template for transformation"
  type        = string
  default     = null
}

# Retry configuration
variable "max_event_age_seconds" {
  description = "Maximum event age before discarding (seconds)"
  type        = number
  default     = 86400 # 24 hours
}

variable "max_retry_attempts" {
  description = "Maximum retry attempts"
  type        = number
  default     = 3
}

# DLQ for rule failures
variable "dlq_arn" {
  description = "ARN of DLQ for failed event delivery (optional)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
