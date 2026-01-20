# modules/api/lambda.tf
# Lambda function for CRUD API handler (connects via RDS Proxy)

# Archive Lambda source code
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda.zip"
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = var.log_group_name
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# Lambda function
resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = "REST API CRUD handler for items (via RDS Proxy)"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  memory_size = var.memory_size
  timeout     = var.timeout

  # VPC configuration for RDS Proxy access
  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [var.security_group_id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = var.db_secret_arn
      DB_HOST       = var.db_host # This is the Proxy endpoint
      DB_PORT       = tostring(var.db_port)
      DB_NAME       = var.db_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
    aws_iam_role_policy_attachment.lambda_secrets,
  ]

  tags = var.tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
