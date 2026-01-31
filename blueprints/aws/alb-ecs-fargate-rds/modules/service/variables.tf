# modules/service/variables.tf

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "ecs_security_group_id" {
  type = string
}

variable "cluster_arn" {
  type = string
}

variable "service_name" {
  type = string
}

variable "task_definition_name" {
  type = string
}

variable "container_name" {
  type    = string
  default = "api"
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

variable "health_check_grace_period" {
  type    = number
  default = 120
}

variable "environment_variables" {
  type    = list(object({ name = string, value = string }))
  default = []
}

variable "db_secret_arn" {
  type = string
}

variable "alb_name" {
  type = string
}

variable "target_group_name" {
  type = string
}

variable "ecr_repository_name" {
  type = string
}

variable "execution_role_name" {
  type = string
}

variable "task_role_name" {
  type = string
}

variable "log_group_name" {
  type = string
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "tags" {
  type    = map(string)
  default = {}
}
