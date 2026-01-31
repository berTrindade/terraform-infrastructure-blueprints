# environments/dev/variables.tf

variable "project" {
  type = string
}

variable "environment" {
  type = string
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
variable "cognito_domain" {
  description = "Unique domain prefix for Cognito hosted UI"
  type        = string
}

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
  default = ["http://localhost:3000/"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000/"]
}

variable "create_identity_pool" {
  type    = bool
  default = false
}

# API Gateway + Lambda
variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "lambda_memory_size" {
  type    = number
  default = 256
}

variable "lambda_timeout" {
  type    = number
  default = 30
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

# Amplify
variable "repository_url" {
  description = "GitHub/GitLab/Bitbucket repository URL"
  type        = string
  default     = ""
}

variable "build_spec" {
  type    = string
  default = null
}

variable "build_output_directory" {
  type    = string
  default = "build"
}

variable "framework" {
  type    = string
  default = "React"
}

variable "main_branch_name" {
  type    = string
  default = "main"
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "branch_environment_variables" {
  type    = map(string)
  default = {}
}

variable "enable_auto_branch_creation" {
  type    = bool
  default = false
}

variable "enable_branch_auto_build" {
  type    = bool
  default = true
}

variable "enable_branch_auto_deletion" {
  type    = bool
  default = false
}

variable "enable_pull_request_preview" {
  type    = bool
  default = false
}

variable "create_webhook" {
  type    = bool
  default = false
}
