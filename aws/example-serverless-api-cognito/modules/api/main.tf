# modules/api/main.tf
# API Gateway with JWT Authorizer

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "REST API with Cognito JWT authentication"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"]
    max_age       = 300
  }

  tags = var.tags
}

# JWT Authorizer
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = var.cognito_issuer_url
  }
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId  = "$context.requestId"
      ip         = "$context.identity.sourceIp"
      httpMethod = "$context.httpMethod"
      routeKey   = "$context.routeKey"
      status     = "$context.status"
      userId     = "$context.authorizer.claims.sub"
    })
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.invoke_arn
  payload_format_version = "2.0"
}

# Protected routes (require auth)
resource "aws_apigatewayv2_route" "create" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "POST /items"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "list" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "GET /items"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "get" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "GET /items/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "update" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "PUT /items/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "delete" {
  api_id             = aws_apigatewayv2_api.this.id
  route_key          = "DELETE /items/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}
