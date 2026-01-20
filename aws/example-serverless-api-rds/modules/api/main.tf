# modules/api/main.tf
# API Gateway HTTP API for Serverless REST API

# ============================================
# HTTP API Gateway
# ============================================

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "REST API for CRUD operations"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  tags = var.tags
}

# ============================================
# Stage
# ============================================

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  tags = var.tags
}

# ============================================
# Lambda Integration
# ============================================

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# Routes
# ============================================

# POST /items - Create
resource "aws_apigatewayv2_route" "create" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /items"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# GET /items - List
resource "aws_apigatewayv2_route" "list" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /items"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# GET /items/{id} - Get by ID
resource "aws_apigatewayv2_route" "get" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# PUT /items/{id} - Update
resource "aws_apigatewayv2_route" "update" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "PUT /items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# DELETE /items/{id} - Delete
resource "aws_apigatewayv2_route" "delete" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "DELETE /items/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# ============================================
# CloudWatch Log Group for API Gateway
# ============================================

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}
