# modules/event_bus/variables.tf
# Input variables for EventBridge event bus module

variable "bus_name" {
  description = "Name of the EventBridge event bus"
  type        = string
}

variable "archive_name" {
  description = "Name of the event archive"
  type        = string
}

variable "enable_archive" {
  description = "Enable event archiving for replay"
  type        = bool
  default     = true
}

variable "archive_retention_days" {
  description = "Days to retain archived events (0 = indefinite)"
  type        = number
  default     = 7
}

variable "archive_event_pattern" {
  description = "JSON event pattern for archive filtering (null = all events)"
  type        = string
  default     = null
}

variable "enable_policy" {
  description = "Enable resource policy for the event bus"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
