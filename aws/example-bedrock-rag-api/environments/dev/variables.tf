# environments/dev/variables.tf

variable "project" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "repository" {
  type    = string
  default = "terraform-infra-blueprints"
}

variable "additional_tags" {
  type    = map(string)
  default = {}
}

# S3
variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "s3_version_retention_days" {
  type    = number
  default = 30
}

# OpenSearch Serverless
variable "opensearch_standby_replicas" {
  description = "ENABLED or DISABLED (DISABLED reduces cost)"
  type        = string
  default     = "DISABLED"
}

# Knowledge Base
variable "vector_index_name" {
  type    = string
  default = "bedrock-knowledge-base-default-index"
}

variable "embedding_model_id" {
  description = "Bedrock embedding model"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "generation_model_id" {
  description = "Bedrock generation model"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

variable "chunk_max_tokens" {
  type    = number
  default = 300
}

variable "chunk_overlap_percentage" {
  type    = number
  default = 20
}

# Lambda
variable "lambda_memory_size" {
  type    = number
  default = 512
}

variable "lambda_timeout" {
  type    = number
  default = 60
}

variable "log_retention_days" {
  type    = number
  default = 14
}
