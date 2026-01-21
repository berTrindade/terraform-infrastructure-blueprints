# modules/tagging/variables.tf
# Input variables for tagging module

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "repository" {
  description = "Source repository"
  type        = string
  default     = "terraform-infra-blueprints"
}

variable "additional_tags" {
  description = "Additional tags to merge"
  type        = map(string)
  default     = {}
}

variable "ttl" {
  description = "TTL for test resources"
  type        = string
  default     = "24h"
}
