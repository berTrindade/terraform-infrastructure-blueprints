# environments/dev/variables.tf

variable "project" {
  description = "Project name used in resource naming"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*[a-z0-9]$", var.project))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"
}

variable "repository" {
  description = "Source repository for tagging"
  type        = string
  default     = "terraform-infra-blueprints"
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# DynamoDB
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "enable_dynamodb_pitr" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "dynamodb_ttl_attribute" {
  description = "TTL attribute name (null to disable)"
  type        = string
  default     = null
}

# Lambda
variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention (days)"
  type        = number
  default     = 14
}

# ============================================
# API Routes Configuration
# ============================================
# Define your API routes here - similar to serverless.yml
# Add new routes by adding entries to this map

variable "api_routes" {
  description = "API route configuration - declarative like serverless.yml. Add new routes here."
  type = map(object({
    method      = string
    path        = string
    description = optional(string, "")
  }))

  default = {
    list_items = {
      method      = "GET"
      path        = "/items"
      description = "List all items"
    }
    create_item = {
      method      = "POST"
      path        = "/items"
      description = "Create a new item"
    }
    get_item = {
      method      = "GET"
      path        = "/items/{id}"
      description = "Get item by ID"
    }
    update_item = {
      method      = "PUT"
      path        = "/items/{id}"
      description = "Update item by ID"
    }
    delete_item = {
      method      = "DELETE"
      path        = "/items/{id}"
      description = "Delete item by ID"
    }
  }

  validation {
    condition = alltrue([
      for k, v in var.api_routes : contains(["GET", "POST", "PUT", "DELETE", "PATCH", "ANY"], v.method)
    ])
    error_message = "Route method must be one of: GET, POST, PUT, DELETE, PATCH, ANY."
  }

  validation {
    condition = alltrue([
      for k, v in var.api_routes : startswith(v.path, "/")
    ])
    error_message = "Route path must start with /."
  }
}
