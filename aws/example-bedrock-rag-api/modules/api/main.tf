# modules/api/main.tf
# API Gateway HTTP API

resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "RAG API for Bedrock Knowledge Base"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = var.tags
}

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

# Routes
resource "aws_apigatewayv2_route" "query" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /query"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "ingest" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /ingest"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "sources" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "GET /sources"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "sync" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /sync"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}
