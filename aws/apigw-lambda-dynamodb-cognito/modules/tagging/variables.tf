# modules/tagging/variables.tf

variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "repository" {
  type    = string
  default = "terraform-infra-blueprints"
}

variable "additional_tags" {
  type    = map(string)
  default = {}
}
