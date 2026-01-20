# modules/data/variables.tf

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "ttl_attribute_name" {
  description = "TTL attribute name (null to disable)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
