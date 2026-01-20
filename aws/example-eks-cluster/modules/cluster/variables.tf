# modules/cluster/variables.tf

variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type    = string
  default = "1.29"
}

variable "cluster_role_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "endpoint_private_access" {
  type    = bool
  default = true
}

variable "endpoint_public_access" {
  type    = bool
  default = true
}

variable "public_access_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "enabled_log_types" {
  type    = list(string)
  default = ["api", "audit", "authenticator"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
