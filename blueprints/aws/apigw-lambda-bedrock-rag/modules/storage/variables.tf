# modules/storage/variables.tf

variable "bucket_name" {
  description = "Name of the S3 bucket for documents"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "version_retention_days" {
  description = "Days to retain old versions"
  type        = number
  default     = 30
}

variable "tags" {
  type    = map(string)
  default = {}
}
