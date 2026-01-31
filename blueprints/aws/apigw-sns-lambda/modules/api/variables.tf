# modules/api/variables.tf
# Input variables for API module

variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "role_name" {
  description = "Name of the IAM role for API Gateway"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic to publish to"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention (days)"
  type        = number
  default     = 14
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
