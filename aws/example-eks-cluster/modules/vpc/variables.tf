# modules/vpc/variables.tf

variable "vpc_name" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "public_subnet_name" {
  type = string
}

variable "private_subnet_name" {
  type = string
}

variable "cluster_name" {
  description = "EKS cluster name for subnet tagging"
  type        = string
}

variable "single_nat_gateway" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
