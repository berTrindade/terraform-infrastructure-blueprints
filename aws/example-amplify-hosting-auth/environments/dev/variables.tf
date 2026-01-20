# environments/dev/variables.tf

variable "project" {
  type = string
}

variable "environment" {
  type = string
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

# Cognito
variable "cognito_domain" {
  description = "Unique domain prefix for Cognito hosted UI"
  type        = string
}

variable "password_minimum_length" {
  type    = number
  default = 8
}

variable "password_require_symbols" {
  type    = bool
  default = false
}

variable "mfa_configuration" {
  type    = string
  default = "OFF"
}

variable "access_token_validity" {
  type    = number
  default = 1
}

variable "id_token_validity" {
  type    = number
  default = 1
}

variable "refresh_token_validity" {
  type    = number
  default = 30
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000/"]
}

variable "create_identity_pool" {
  type    = bool
  default = false
}

# Amplify
variable "repository_url" {
  description = "GitHub/GitLab/Bitbucket repository URL"
  type        = string
  default     = ""
}

variable "build_spec" {
  type    = string
  default = null
}

variable "build_output_directory" {
  type    = string
  default = "build"
}

variable "framework" {
  type    = string
  default = "React"
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
