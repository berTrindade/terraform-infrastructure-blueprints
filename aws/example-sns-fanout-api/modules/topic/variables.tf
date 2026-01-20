# modules/topic/variables.tf
# Input variables for SNS topic module

variable "topic_name" {
  description = "Name of the SNS topic"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (null uses AWS managed key)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
