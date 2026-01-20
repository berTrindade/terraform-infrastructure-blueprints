# modules/tagging/main.tf
# Tagging convention module
# Based on terraform-skill module-patterns

locals {
  # Standard tags applied to all resources
  default_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    Repository  = var.repository
  }

  # Merge default tags with any additional tags
  tags = merge(local.default_tags, var.additional_tags)

  # Tags with TTL for test resources
  test_tags = var.environment == "dev" ? merge(local.tags, {
    TTL = var.ttl
  }) : local.tags
}
