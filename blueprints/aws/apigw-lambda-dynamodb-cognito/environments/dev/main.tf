# environments/dev/main.tf

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

module "auth" {
  source                   = "../../modules/auth"
  user_pool_name           = module.naming.user_pool
  user_pool_client_name    = module.naming.user_pool_client
  password_minimum_length  = var.password_minimum_length
  password_require_symbols = var.password_require_symbols
  mfa_configuration        = var.mfa_configuration
  access_token_validity    = var.access_token_validity
  id_token_validity        = var.id_token_validity
  refresh_token_validity   = var.refresh_token_validity
  callback_urls            = var.callback_urls
  logout_urls              = var.logout_urls
  tags                     = module.tagging.tags
}

module "data" {
  source                        = "../../modules/data"
  table_name                    = module.naming.dynamodb_table
  billing_mode                  = var.dynamodb_billing_mode
  enable_point_in_time_recovery = var.enable_dynamodb_pitr
  tags                          = module.tagging.tags
}

# ============================================
# API Layer: Lambda (Official Module)
# ============================================
# Routes are defined in var.api_routes - add new routes there!

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "CRUD API handler with Cognito JWT authentication"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  environment_variables = {
    DYNAMODB_TABLE = module.data.table_name
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
        module.data.table_arn,
        "${module.data.table_arn}/index/*"
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
# API Gateway v2 with JWT Auth (Official Module)
# ============================================
# Routes are dynamically generated from var.api_routes
# All routes require Cognito JWT authentication

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "REST API with Cognito JWT authentication"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  # JWT Authorizer for Cognito
  authorizers = {
    cognito = {
      authorizer_type  = "JWT"
      identity_sources = ["$request.header.Authorization"]
      name             = "cognito-jwt"
      jwt_configuration = {
        audience = [module.auth.user_pool_client_id]
        issuer   = module.auth.issuer_url
      }
    }
  }

  # Dynamic routes from var.api_routes with JWT authorization
  create_routes_and_integrations = true
  routes = {
    for name, config in var.api_routes : "${config.method} ${config.path}" => {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
      authorization_type = "JWT"
      authorizer_key     = "cognito"
    }
  }

  tags = module.tagging.tags
}
