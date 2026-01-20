# modules/data/variables.tf

variable "table_name" {
  type = string
}

variable "billing_mode" {
  type    = string
  default = "PAY_PER_REQUEST"
}

variable "enable_point_in_time_recovery" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
