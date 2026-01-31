# modules/compute/variables.tf
# Input variables for Lambda compute module

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

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for Lambda"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB credentials"
  type        = string
}

variable "db_host" {
  description = "Database host endpoint (Aurora cluster endpoint)"
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

variable "db_username" {
  description = "Database username for IAM authentication"
  type        = string
}

variable "cluster_resource_id" {
  description = "Aurora cluster resource ID for IAM database authentication"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

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
