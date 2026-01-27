terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "invoice_api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  description   = "Invoice Management API"
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "invoice_api_stage" {
  api_id      = aws_apigatewayv2_api.invoice_api.id
  name        = var.environment
  auto_deploy = true
}

# Lambda Function
resource "aws_lambda_function" "invoice_handler" {
  filename         = "../src/handler.zip"
  function_name    = "${var.project_name}-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handler.handler"
  runtime         = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      # TODO: Add database connection string from Secrets Manager
      # TODO: Add database endpoint variable
    }
  }

  # TODO: Add VPC configuration for RDS access
  # vpc_config {
  #   subnet_ids         = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  #   security_group_ids = [aws_security_group.lambda.id]
  # }
}

# Lambda Function Code Archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "../src/handler.js"
  output_path = "../src/handler.zip"
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Basic Lambda Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# TODO: Add VPC access policy for Lambda
# TODO: Add Secrets Manager read policy for database credentials

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.invoice_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.invoice_api.execution_arn}/*/*"
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.invoice_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.invoice_handler.invoke_arn
}

# API Gateway Routes
resource "aws_apigatewayv2_route" "get_invoices" {
  api_id    = aws_apigatewayv2_api.invoice_api.id
  route_key = "GET /invoices"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "post_invoices" {
  api_id    = aws_apigatewayv2_api.invoice_api.id
  route_key = "POST /invoices"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_invoice" {
  api_id    = aws_apigatewayv2_api.invoice_api.id
  route_key = "GET /invoices/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "delete_invoice" {
  api_id    = aws_apigatewayv2_api.invoice_api.id
  route_key = "DELETE /invoices/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# TODO: Add RDS PostgreSQL database
# TODO: Add VPC with private subnets for RDS
# TODO: Add security groups for Lambda -> RDS communication
# TODO: Add Secrets Manager secret for database credentials
