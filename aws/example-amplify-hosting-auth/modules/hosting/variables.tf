# modules/hosting/variables.tf

variable "app_name" {
  type = string
}

variable "repository_url" {
  description = "GitHub/GitLab/Bitbucket repository URL"
  type        = string
  default     = ""
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_client_id" {
  type = string
}

variable "build_spec" {
  description = "Custom build specification (YAML)"
  type        = string
  default     = null
}

variable "build_output_directory" {
  description = "Build output directory"
  type        = string
  default     = "build"
}

variable "framework" {
  description = "Framework (e.g., React, Vue, Next.js)"
  type        = string
  default     = "React"
}

variable "main_branch_name" {
  type    = string
  default = "main"
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "branch_environment_variables" {
  type    = map(string)
  default = {}
}

variable "enable_auto_branch_creation" {
  type    = bool
  default = false
}

variable "enable_branch_auto_build" {
  type    = bool
  default = true
}

variable "enable_branch_auto_deletion" {
  type    = bool
  default = false
}

variable "enable_pull_request_preview" {
  type    = bool
  default = false
}

variable "create_webhook" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
