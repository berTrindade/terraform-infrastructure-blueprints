variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "invoice-api"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# TODO: Add database-related variables
# variable "db_instance_class" {
#   description = "RDS instance class"
#   type        = string
#   default     = "db.t3.micro"
# }
#
# variable "db_name" {
#   description = "Database name"
#   type        = string
#   default     = "invoices"
# }
#
# variable "db_username" {
#   description = "Database master username"
#   type        = string
#   sensitive   = true
# }
#
# variable "db_password" {
#   description = "Database master password"
#   type        = string
#   sensitive   = true
# }
