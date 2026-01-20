# modules/api/variables.tf
# API module input variables
# Based on terraform-skill code-patterns (variable ordering)

# ----------------------------------------
# API Gateway configuration
# ----------------------------------------

variable "api_name" {
  description = "Name of the API Gateway HTTP API"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

# ----------------------------------------
# IAM configuration
# ----------------------------------------

variable "role_name" {
  description = "Name of the IAM role for API Gateway SQS integration"
  type        = string
}

# ----------------------------------------
# Integration: SQS
# ----------------------------------------

variable "sqs_queue_url" {
  description = "URL of the SQS queue for message delivery"
  type        = string
}

variable "sqs_queue_arn" {
  description = "ARN of the SQS queue (for IAM policy)"
  type        = string
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
