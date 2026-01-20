# modules/api/variables.tf

variable "api_name" {
  type = string
}

variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "function_name" {
  type = string
}

variable "role_name" {
  type = string
}

variable "log_group_name" {
  type = string
}

variable "source_dir" {
  type = string
}

variable "memory_size" {
  type    = number
  default = 512
}

variable "timeout" {
  type    = number
  default = 60
}

variable "knowledge_base_id" {
  type = string
}

variable "data_source_id" {
  type = string
}

variable "generation_model_id" {
  description = "Bedrock model for generation"
  type        = string
  default     = "anthropic.claude-3-sonnet-20240229-v1:0"
}

variable "s3_bucket_name" {
  type = string
}

variable "s3_bucket_arn" {
  type = string
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}
