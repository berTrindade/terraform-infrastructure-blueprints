# modules/tagging/main.tf
# Standard tagging module for GCP App Engine + Cloud SQL

locals {
  # Standard labels applied to all resources
  standard_labels = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }

  # Merge standard labels with any additional labels
  labels = merge(local.standard_labels, var.additional_labels)
}
