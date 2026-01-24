# modules/auth/variables.tf
# Cognito User Pool variables

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

variable "email_sending_account" {
  description = "Email sending account (COGNITO_DEFAULT or DEVELOPER)"
  type        = string
  default     = "COGNITO_DEFAULT"
}

variable "from_email_address" {
  description = "From email address (required if email_sending_account is DEVELOPER)"
  type        = string
  default     = null
}

variable "reply_to_email_address" {
  description = "Reply-to email address"
  type        = string
  default     = null
}

variable "create_domain" {
  description = "Create Cognito domain for hosted UI"
  type        = bool
  default     = false
}

variable "domain_prefix" {
  description = "Domain prefix for Cognito hosted UI (must be unique globally)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
