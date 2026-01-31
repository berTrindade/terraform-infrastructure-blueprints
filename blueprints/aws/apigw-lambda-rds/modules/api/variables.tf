# modules/api/variables.tf
# Input variables for API module

# ============================================
# API Gateway Configuration
# ============================================

variable "api_name" {
  description = "Name for the API Gateway"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

# ============================================
# Lambda Configuration
# ============================================

variable "function_name" {
  description = "Name for the Lambda function"
  type        = string
}

variable "role_name" {
  description = "Name for the IAM role"
  type        = string
}

variable "log_group_name" {
  description = "Name for the CloudWatch log group"
  type        = string
}

variable "source_dir" {
  description = "Path to Lambda source code directory"
  type        = string
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

# ============================================
# VPC Configuration
# ============================================

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for Lambda"
  type        = string
}

# ============================================
# Database Configuration
# ============================================

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB credentials"
  type        = string
}

variable "db_host" {
  description = "Database host endpoint"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "app"
}

# ============================================
# Observability
# ============================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
