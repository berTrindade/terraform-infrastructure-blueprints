# modules/vpc/variables.tf
# Input variables for VPC module

variable "vpc_name" {
  description = "Name for the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

variable "subnet_name_prefix" {
  description = "Prefix for subnet names"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name for the DB subnet group"
  type        = string
}

variable "security_group_prefix" {
  description = "Prefix for security group names"
  type        = string
}

variable "aws_region" {
  description = "AWS region for VPC endpoints"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
