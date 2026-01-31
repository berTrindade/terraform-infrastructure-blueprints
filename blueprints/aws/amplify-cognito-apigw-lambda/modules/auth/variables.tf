# modules/auth/variables.tf

variable "user_pool_name" {
  type = string
}

variable "user_pool_client_name" {
  type = string
}

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

variable "identity_pool_name" {
  type    = string
  default = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
