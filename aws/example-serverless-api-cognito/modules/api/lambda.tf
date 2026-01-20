# modules/api/lambda.tf

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda.zip"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = var.log_group_name
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = "REST API CRUD handler with user context"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  memory_size = var.memory_size
  timeout     = var.timeout

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_dynamodb,
  ]

  tags = var.tags
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
