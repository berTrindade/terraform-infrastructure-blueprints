variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "additional_labels" {
  description = "Additional labels to apply to resources"
  type        = map(string)
  default     = {}
}
