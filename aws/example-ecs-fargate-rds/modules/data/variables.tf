# modules/data/variables.tf

variable "db_instance_identifier" {
  type = string
}

variable "db_engine_version" {
  type    = string
  default = "16.3"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_max_allocated_storage" {
  type    = number
  default = 100
}

variable "db_storage_type" {
  type    = string
  default = "gp3"
}

variable "db_name" {
  type    = string
  default = "app"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_security_group_id" {
  type = string
}

variable "db_subnet_group_name" {
  type = string
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "skip_final_snapshot" {
  type    = bool
  default = true
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "backup_retention_period" {
  type    = number
  default = 7
}

variable "backup_window" {
  type    = string
  default = "03:00-04:00"
}

variable "maintenance_window" {
  type    = string
  default = "Mon:04:00-Mon:05:00"
}

variable "enable_performance_insights" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
