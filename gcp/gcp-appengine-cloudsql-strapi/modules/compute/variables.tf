variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "location_id" {
  description = "App Engine location ID (e.g., us-central)"
  type        = string
  default     = "us-central"
}
