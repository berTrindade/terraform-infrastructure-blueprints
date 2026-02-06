# Minimal "existing" Terraform: API Gateway + Lambda only (no DynamoDB, no SQS).
# This represents the state before adding SQS + worker (see ../after/).

# Naming and tagging from the API+DynamoDB blueprint (no DynamoDB used here)
module "naming" {
  source = "../../../blueprints/aws/apigw-lambda-dynamodb/modules/naming"

  project     = var.project
  environment = var.environment
}

module "tagging" {
  source = "../../../blueprints/aws/apigw-lambda-dynamodb/modules/tagging"

  project         = var.project
  environment     = var.environment
  repository      = var.repository
  additional_tags = var.additional_tags
}

# Lambda (API handler)
module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "Minimal API Lambda (before adding SQS)"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  cloudwatch_logs_retention_in_days = var.log_retention_days

  attach_policy_statements = true
  policy_statements        = {}

  allowed_triggers = {
    APIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  tags = module.tagging.tags
}

# API Gateway HTTP API
module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "Minimal API (before adding SQS)"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  create_routes_and_integrations = true
  routes = {
    for name, config in var.api_routes : "${config.method} ${config.path}" => {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
  }

  tags = module.tagging.tags
}
