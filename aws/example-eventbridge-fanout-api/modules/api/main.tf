# modules/api/main.tf
# API Gateway HTTP API with EventBridge integration
# Puts events to custom event bus for routing

# HTTP API (API Gateway v2)
resource "aws_apigatewayv2_api" "this" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "Event-driven API with EventBridge routing"

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

# EventBridge integration - puts events to bus
resource "aws_apigatewayv2_integration" "eventbridge" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_subtype    = "EventBridge-PutEvents"
  credentials_arn        = aws_iam_role.api_gateway.arn
  payload_format_version = "1.0"

  request_parameters = {
    "EventBusName" = var.event_bus_name
    "Source"       = var.event_source
    "DetailType"   = "$request.body.detailType"
    "Detail"       = "$request.body.detail"
  }
}

# POST /events route - puts events to EventBridge
resource "aws_apigatewayv2_route" "post_events" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "POST /events"
  target    = "integrations/${aws_apigatewayv2_integration.eventbridge.id}"
}
