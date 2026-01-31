# modules/worker/lambda.tf
# Worker Lambda function
# Based on terraform-skill module-patterns

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
  description   = "Worker - processes commands from SQS and updates DynamoDB"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  memory_size = var.memory_size
  timeout     = var.timeout

  # Reserved concurrency to prevent runaway scaling
  reserved_concurrent_executions = var.reserved_concurrency

  environment {
    variables = merge(
      {
        DYNAMODB_TABLE = var.dynamodb_table_name
      },
      var.external_api_secret_arn != null ? {
        EXTERNAL_API_SECRET_ARN = var.external_api_secret_arn
      } : {}
    )
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_dynamodb,
    aws_iam_role_policy_attachment.lambda_sqs,
  ]

  tags = var.tags
}
