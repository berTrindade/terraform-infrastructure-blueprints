# modules/cluster/variables.tf

variable "cluster_name" {
  type = string
}

variable "enable_container_insights" {
  type    = bool
  default = true
}

variable "use_fargate_spot" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
