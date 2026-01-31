# modules/queue/versions.tf
# Provider version constraints
# Based on terraform-skill code-patterns (version management)

terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
