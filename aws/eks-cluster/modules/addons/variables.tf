# modules/addons/variables.tf

variable "cluster_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "oidc_provider_arn" {
  type = string
}

variable "oidc_issuer" {
  description = "OIDC issuer URL without https://"
  type        = string
}

# Addon versions (null = latest)
variable "coredns_version" {
  type    = string
  default = null
}

variable "vpc_cni_version" {
  type    = string
  default = null
}

variable "kube_proxy_version" {
  type    = string
  default = null
}

variable "ebs_csi_version" {
  type    = string
  default = null
}

# Role names
variable "ebs_csi_role_name" {
  type = string
}

variable "lb_controller_role_name" {
  type = string
}

# AWS Load Balancer Controller
variable "enable_lb_controller" {
  type    = bool
  default = true
}

variable "lb_controller_chart_version" {
  type    = string
  default = "1.8.0"
}

variable "tags" {
  type    = map(string)
  default = {}
}
