# modules/api/variables.tf
# AppSync API module variables

variable "api_name" {
  description = "Name of the AppSync GraphQL API"
  type        = string
}

variable "user_pool_id" {
  description = "Cognito User Pool ID for authentication"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "schema_file" {
  description = "Path to GraphQL schema file"
  type        = string
}

variable "lambda_function_arn" {
  description = "ARN of the Lambda function resolver"
  type        = string
}

variable "lambda_service_role_arn" {
  description = "ARN of the IAM role that allows AppSync to invoke Lambda"
  type        = string
}

variable "query_resolvers" {
  description = "Map of Query field names to resolver configurations"
  type        = map(any)
  default     = {}
}

variable "mutation_resolvers" {
  description = "Map of Mutation field names to resolver configurations"
  type        = map(any)
  default     = {}
}

variable "request_template" {
  description = "Request mapping template for resolvers"
  type        = string
  default     = <<-EOT
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": $util.toJson($ctx)
    }
  EOT
}

variable "response_template" {
  description = "Response mapping template for resolvers"
  type        = string
  default     = "$util.toJson($ctx.result)"
}

variable "log_level" {
  description = "CloudWatch log level (NONE, ERROR, ALL)"
  type        = string
  default     = "ALL"
}

variable "xray_enabled" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

variable "create_api_key" {
  description = "Create an API key for testing/development"
  type        = bool
  default     = true
}

variable "api_key_expires" {
  description = "API key expiration date (RFC3339 format)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
