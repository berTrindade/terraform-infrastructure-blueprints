variable "project" {
  description = "Project name (lowercase, alphanumeric, hyphens)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens only."
  }
}

variable "project_id" {
  description = "GCP project ID"
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

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "database_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 10
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = false
}

variable "pitr_enabled" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = false
}

variable "storage_bucket_name" {
  description = "Base name for Cloud Storage bucket (will be suffixed with environment)"
  type        = string
}

variable "subnet_cidr" {
  description = "CIDR range for VPC subnet"
  type        = string
  default     = "10.8.0.0/20"
}

variable "connector_cidr" {
  description = "CIDR range for VPC connector (/28)"
  type        = string
  default     = "10.8.32.0/28"
}

variable "database_password" {
  description = "Database user password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "create_secrets" {
  description = "Whether to create secret versions (set to false for CI/CD)"
  type        = bool
  default     = false
}

variable "additional_labels" {
  description = "Additional labels to apply to resources"
  type        = map(string)
  default     = {}
}
