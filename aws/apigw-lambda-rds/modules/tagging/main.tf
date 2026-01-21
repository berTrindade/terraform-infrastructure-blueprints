# modules/tagging/main.tf
# Standard tagging module for Serverless REST API
# Based on terraform-skill module-patterns

locals {
  # Standard tags applied to all resources
  standard_tags = {
    Project     = var.project
    Environment = var.environment
    Repository  = var.repository
    ManagedBy   = "terraform"
  }

  # Merge standard tags with any additional tags
  tags = merge(local.standard_tags, var.additional_tags)
}
