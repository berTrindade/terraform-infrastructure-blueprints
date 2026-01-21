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

# Cognito
variable "password_minimum_length" {
  type    = number
  default = 8
}

variable "password_require_symbols" {
  type    = bool
  default = false
}

variable "mfa_configuration" {
  type    = string
  default = "OFF"
}

variable "access_token_validity" {
  type    = number
  default = 1
}

variable "id_token_validity" {
  type    = number
  default = 1
}

variable "refresh_token_validity" {
  type    = number
  default = 30
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000"]
}

# DynamoDB
variable "dynamodb_billing_mode" {
  type    = string
  default = "PAY_PER_REQUEST"
}

variable "enable_dynamodb_pitr" {
  type    = bool
  default = true
}

# Lambda
variable "lambda_memory_size" {
  type    = number
  default = 256
}

variable "lambda_timeout" {
  type    = number
  default = 30
}

variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "log_retention_days" {
  type    = number
  default = 14
}

# ============================================
# API Routes Configuration
# ============================================
# Define your API routes here - similar to serverless.yml
# All routes require JWT authentication by default

variable "api_routes" {
  description = "API route configuration - declarative like serverless.yml. All routes require JWT auth."
  type = map(object({
    method      = string
    path        = string
    description = optional(string, "")
  }))

  default = {
    list_items = {
      method      = "GET"
      path        = "/items"
      description = "List all items (requires auth)"
    }
    create_item = {
      method      = "POST"
      path        = "/items"
      description = "Create a new item (requires auth)"
    }
    get_item = {
      method      = "GET"
      path        = "/items/{id}"
      description = "Get item by ID (requires auth)"
    }
    update_item = {
      method      = "PUT"
      path        = "/items/{id}"
      description = "Update item by ID (requires auth)"
    }
    delete_item = {
      method      = "DELETE"
      path        = "/items/{id}"
      description = "Delete item by ID (requires auth)"
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
