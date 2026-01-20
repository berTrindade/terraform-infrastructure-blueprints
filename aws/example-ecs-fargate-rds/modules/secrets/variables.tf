# modules/secrets/variables.tf

variable "secret_name" {
  type = string
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_host" {
  type    = string
  default = ""
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_name" {
  type    = string
  default = "app"
}

variable "recovery_window_in_days" {
  type    = number
  default = 7
}

variable "tags" {
  type    = map(string)
  default = {}
}
