# environments/dev/variables.tf

variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "repository" {
  type    = string
  default = "terraform-infra-blueprints"
}

variable "additional_tags" {
  type    = map(string)
  default = {}
}

# VPC
variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "single_nat_gateway" {
  type    = bool
  default = true
}

# Database
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

variable "db_name" {
  type    = string
  default = "app"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_multi_az" {
  type    = bool
  default = false
}

variable "db_skip_final_snapshot" {
  type    = bool
  default = true
}

variable "db_deletion_protection" {
  type    = bool
  default = false
}

variable "db_backup_retention_period" {
  type    = number
  default = 7
}

variable "db_enable_performance_insights" {
  type    = bool
  default = false
}

# ECS
variable "enable_container_insights" {
  type    = bool
  default = true
}

variable "use_fargate_spot" {
  type    = bool
  default = false
}

variable "container_image" {
  type    = string
  default = null
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "task_cpu" {
  type    = number
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "environment_variables" {
  type    = list(object({ name = string, value = string }))
  default = []
}

variable "log_retention_days" {
  type    = number
  default = 14
}
