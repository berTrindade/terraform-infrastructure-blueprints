variable "instance_name" {
  description = "Name of the Cloud SQL instance"
  type        = string
}

variable "database_name" {
  description = "Name of the database"
  type        = string
}

variable "database_user" {
  description = "Database user name"
  type        = string
}

variable "database_password" {
  description = "Database user password"
  type        = string
  sensitive   = true
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "database_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "disk_size" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "disk_type" {
  description = "Disk type (PD_SSD, PD_STANDARD)"
  type        = string
  default     = "PD_SSD"
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

variable "enable_public_ip" {
  description = "Enable public IP for Cloud SQL"
  type        = bool
  default     = false
}

variable "vpc_network_id" {
  description = "VPC network ID for private IP"
  type        = string
  default     = null
}

variable "vpc_peering_connection" {
  description = "VPC peering connection resource (for dependency)"
  type        = any
  default     = null
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}
