# modules/vector/variables.tf

variable "collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  type        = string
}

variable "standby_replicas" {
  description = "Standby replicas (ENABLED or DISABLED)"
  type        = string
  default     = "DISABLED"
}

variable "additional_principals" {
  description = "Additional IAM principals for data access"
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
