# modules/api/variables.tf

variable "api_name" {
  type = string
}

variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "cognito_client_id" {
  type = string
}

variable "cognito_issuer_url" {
  type = string
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
  default = 256
}

variable "timeout" {
  type    = number
  default = 30
}

variable "dynamodb_table_name" {
  type = string
}

variable "dynamodb_table_arn" {
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
