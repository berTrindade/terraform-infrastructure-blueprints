variable "bucket_name" {
  description = "Name of the Cloud Storage bucket (must be globally unique)"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "location" {
  description = "Bucket location"
  type        = string
}

variable "force_destroy" {
  description = "Force destroy bucket even if it contains objects"
  type        = bool
  default     = false
}

variable "public_access_prevention" {
  description = "Public access prevention (enforced, inherited)"
  type        = string
  default     = "enforced"
}

variable "enable_cors" {
  description = "Enable CORS configuration"
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "HEAD", "PUT", "POST", "DELETE"]
}

variable "cors_response_headers" {
  description = "CORS allowed response headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_max_age_seconds" {
  description = "CORS max age in seconds"
  type        = number
  default     = 3600
}

variable "service_account_id" {
  description = "Service account ID for storage access"
  type        = string
}

variable "service_account_display_name" {
  description = "Service account display name"
  type        = string
}

variable "service_account_description" {
  description = "Service account description"
  type        = string
  default     = "Service account for Cloud Storage access"
}
