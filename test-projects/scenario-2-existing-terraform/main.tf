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

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = "${var.project}-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
  }
}

module "lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "${var.project}-${var.environment}"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/lambda"

  environment_variables = {
    ENVIRONMENT = var.environment
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id = module.api_gateway.api_id

  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = module.lambda.lambda_function_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = module.api_gateway.api_id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.api_execution_arn}/*/*"
}
