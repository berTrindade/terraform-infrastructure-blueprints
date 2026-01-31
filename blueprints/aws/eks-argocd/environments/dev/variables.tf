# environments/dev/variables.tf

variable "project" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
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

# EKS Cluster
variable "cluster_version" {
  type    = string
  default = "1.29"
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

# Node Group
variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "node_capacity_type" {
  type    = string
  default = "ON_DEMAND"
}

variable "node_disk_size" {
  type    = number
  default = 50
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_min_size" {
  type    = number
  default = 1
}

variable "node_max_size" {
  type    = number
  default = 5
}

variable "node_labels" {
  type    = map(string)
  default = {}
}

variable "node_taints" {
  type = list(object({
    key    = string
    value  = string
    effect = string
  }))
  default = []
}

# Addons
variable "enable_lb_controller" {
  type    = bool
  default = true
}

variable "lb_controller_chart_version" {
  type    = string
  default = "1.8.0"
}

# ArgoCD
variable "argocd_chart_version" {
  type    = string
  default = "5.55.0"
}

variable "argocd_ha_enabled" {
  type    = bool
  default = false
}

variable "argocd_set_resources" {
  type    = bool
  default = true
}

variable "argocd_enable_ingress" {
  description = "Enable Gateway API for ArgoCD UI (creates Gateway + HTTPRoute resources)"
  type        = bool
  default     = true
}

variable "argocd_ingress_scheme" {
  description = "ALB scheme for Gateway API: internet-facing or internal"
  type        = string
  default     = "internet-facing"
}

variable "argocd_values" {
  type    = list(string)
  default = []
}
