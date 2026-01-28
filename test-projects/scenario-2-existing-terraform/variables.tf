variable "project" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment name"
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}
