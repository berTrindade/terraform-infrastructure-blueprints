# environments/dev/versions.tf
# Terraform and provider version constraints
# Based on terraform-skill code-patterns (version management)

terraform {
  # Terraform version - pin to minor, allow patch
  # >= 1.9 for cross-variable validation
  # >= 1.10 for ephemeral values
  # >= 1.11 for write-only arguments
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# AWS Provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
