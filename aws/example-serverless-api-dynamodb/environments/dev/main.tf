# environments/dev/main.tf
# Development environment - Serverless API with DynamoDB
# Uses official terraform-aws-modules for battle-tested infrastructure

module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

module "tagging" {
  source          = "../../modules/tagging"
  project         = var.project
  environment     = var.environment
  repository      = var.repository
  additional_tags = var.additional_tags
}

# ============================================
# DynamoDB (Official Module)
# ============================================

module "dynamodb" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 4.0"

  name         = module.naming.dynamodb_table
  hash_key     = "id"
  billing_mode = var.dynamodb_billing_mode

  attributes = [
    {
      name = "id"
      type = "S"
    }
  ]

  server_side_encryption_enabled = true
  point_in_time_recovery_enabled = var.enable_dynamodb_pitr

  ttl_enabled        = var.dynamodb_ttl_attribute != null
  ttl_attribute_name = var.dynamodb_ttl_attribute

  tags = module.tagging.tags
}

# ============================================
# API Gateway + Lambda (Official Module)
# ============================================

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "Serverless API for DynamoDB CRUD operations"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  environment_variables = {
    DYNAMODB_TABLE = module.dynamodb.dynamodb_table_id
  }

  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days

  # IAM permissions for DynamoDB
  attach_policy_statements = true
  policy_statements = {
    dynamodb = {
      effect = "Allow"
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      resources = [
        module.dynamodb.dynamodb_table_arn,
        "${module.dynamodb.dynamodb_table_arn}/index/*"
      ]
    }
  }

  # API Gateway trigger
  allowed_triggers = {
    APIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  tags = module.tagging.tags
}

# ============================================
# API Gateway v2 (Official Module)
# ============================================

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "Serverless API Gateway for DynamoDB"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  # Lambda integration
  create_routes_and_integrations = true
  routes = {
    "ANY /{proxy+}" = {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
  }

  tags = module.tagging.tags
}
