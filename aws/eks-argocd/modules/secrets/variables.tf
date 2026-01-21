# modules/secrets/variables.tf
# Flow B (Third-Party Secrets) variables
# Based on terraform-secrets-poc engineering standard

variable "secret_prefix" {
  description = <<-EOT
    Prefix for secret names using /{env}/{app} format.
    Example: /dev/myapp
  EOT
  type        = string

  validation {
    condition     = can(regex("^/[a-z]+/[a-z][a-z0-9-]*$", var.secret_prefix))
    error_message = "Secret prefix must be in format /{env}/{app} (lowercase)."
  }
}

variable "secrets" {
  description = <<-EOT
    Map of third-party secrets to create.
    These are shell secrets - engineers seed actual values after terraform apply.
    
    Example:
      secrets = {
        stripe-api-key = {
          description = "Stripe API key"
          secret_type = "api-key"
        }
        oauth-credentials = {
          description = "OAuth client credentials"
          secret_type = "oauth-credentials"
        }
      }
  EOT
  type = map(object({
    description = string
    secret_type = optional(string, "api-key")
  }))
  default = {}
}

variable "recovery_window_in_days" {
  description = "Number of days before a deleted secret is permanently removed (7-30)"
  type        = number
  default     = 7

  validation {
    condition     = var.recovery_window_in_days >= 7 && var.recovery_window_in_days <= 30
    error_message = "Recovery window must be between 7 and 30 days."
  }
}

variable "tags" {
  description = "Tags to apply to all secrets"
  type        = map(string)
  default     = {}
}
