# modules/tagging/variables.tf
# Tagging module input variables
# Based on terraform-skill code-patterns (variable ordering)

variable "project" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "repository" {
  description = "Source repository URL for ManagedBy tracking"
  type        = string
  default     = "terraform-infra-blueprints"
}

variable "additional_tags" {
  description = "Additional tags to merge with default tags"
  type        = map(string)
  default     = {}
}

variable "ttl" {
  description = "Time-to-live for dev/test resources (used for auto-cleanup)"
  type        = string
  default     = "24h"
}
