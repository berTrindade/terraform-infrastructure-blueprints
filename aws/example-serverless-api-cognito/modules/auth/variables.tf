# modules/auth/variables.tf

variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
}

variable "user_pool_client_name" {
  description = "Name of the Cognito User Pool Client"
  type        = string
}

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 8
}

variable "password_require_symbols" {
  description = "Require symbols in password"
  type        = bool
  default     = false
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OFF"
}

variable "access_token_validity" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "id_token_validity" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "callback_urls" {
  description = "Callback URLs for hosted UI"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "Logout URLs for hosted UI"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
