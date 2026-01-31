# modules/api/main.tf
# AppSync GraphQL API module with Cognito authentication and Lambda resolvers

# CloudWatch Logs Role for AppSync
resource "aws_iam_role" "appsync_logs" {
  name = "${var.api_name}-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "appsync_logs" {
  role       = aws_iam_role.appsync_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

# AppSync GraphQL API
resource "aws_appsync_graphql_api" "this" {
  name                = var.api_name
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    user_pool_id   = var.user_pool_id
    aws_region     = var.aws_region
    default_action = "ALLOW"
  }

  # Additional authentication providers (optional API key for testing)
  additional_authentication_provider {
    authentication_type = "API_KEY"
  }

  # Logging configuration
  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level          = var.log_level
  }

  # X-Ray tracing
  xray_enabled = var.xray_enabled

  tags = var.tags
}

# GraphQL Schema
resource "aws_appsync_graphql_schema" "this" {
  api_id      = aws_appsync_graphql_api.this.id
  definition  = file(var.schema_file)
}

# Lambda Data Source
resource "aws_appsync_datasource" "lambda" {
  api_id           = aws_appsync_graphql_api.this.id
  name             = "${var.api_name}-lambda-datasource"
  type             = "AWS_LAMBDA"
  service_role_arn = var.lambda_service_role_arn

  lambda_config {
    function_arn = var.lambda_function_arn
  }
}

# Resolvers
# Query resolvers
resource "aws_appsync_resolver" "query_resolvers" {
  for_each = var.query_resolvers

  api_id      = aws_appsync_graphql_api.this.id
  type        = "Query"
  field       = each.key
  data_source = aws_appsync_datasource.lambda.name

  request_template  = var.request_template
  response_template = var.response_template

  depends_on = [aws_appsync_graphql_schema.this]
}

# Mutation resolvers
resource "aws_appsync_resolver" "mutation_resolvers" {
  for_each = var.mutation_resolvers

  api_id      = aws_appsync_graphql_api.this.id
  type        = "Mutation"
  field       = each.key
  data_source = aws_appsync_datasource.lambda.name

  request_template  = var.request_template
  response_template = var.response_template

  depends_on = [aws_appsync_graphql_schema.this]
}

# API Key (for testing/development)
resource "aws_appsync_api_key" "this" {
  count     = var.create_api_key ? 1 : 0
  api_id    = aws_appsync_graphql_api.this.id
  expires   = var.api_key_expires
}
