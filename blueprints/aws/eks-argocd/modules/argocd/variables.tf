# modules/argocd/variables.tf

variable "namespace" {
  type    = string
  default = "argocd"
}

variable "chart_version" {
  type    = string
  default = "5.55.0"
}

variable "ha_enabled" {
  description = "Enable HA mode"
  type        = bool
  default     = false
}

variable "set_resources" {
  description = "Set resource limits (useful for dev)"
  type        = bool
  default     = true
}

variable "enable_ingress" {
  description = "Create ALB Gateway API for ArgoCD UI"
  type        = bool
  default     = true
}

variable "ingress_scheme" {
  description = "ALB scheme: internet-facing or internal (used for Gateway API)"
  type        = string
  default     = "internet-facing"
}

variable "values" {
  description = "Additional Helm values"
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
