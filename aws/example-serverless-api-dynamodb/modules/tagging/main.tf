# modules/tagging/main.tf

locals {
  standard_tags = {
    Project     = var.project
    Environment = var.environment
    Repository  = var.repository
    ManagedBy   = "terraform"
  }

  tags = merge(local.standard_tags, var.additional_tags)
}
