# modules/api/main.tf
# API Gateway HTTP API with SQS integration
# Lower latency and cost - no intermediate Lambda

# HTTP API (API Gateway v2)
resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "Async API with SQS Worker"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = var.tags
}

# Default stage with auto-deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId          = "$context.requestId"
      ip                 = "$context.identity.sourceIp"
      requestTime        = "$context.requestTime"
      httpMethod         = "$context.httpMethod"
      routeKey           = "$context.routeKey"
      status             = "$context.status"
      responseLength     = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
    })
  }

  tags = var.tags
}

# CloudWatch log group for API access logs
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# SQS integration - sends directly to queue
resource "aws_apigatewayv2_integration" "sqs" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_subtype    = "SQS-SendMessage"
  credentials_arn        = aws_iam_role.api_gateway.arn
  payload_format_version = "1.0"

  request_parameters = {
    "QueueUrl"    = var.sqs_queue_url
    "MessageBody" = "$request.body"
  }
}

# POST /commands route - sends to SQS
resource "aws_apigatewayv2_route" "post_commands" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /commands"
  target    = "integrations/${aws_apigatewayv2_integration.sqs.id}"
}
