# modules/worker/iam.tf
# IAM roles and policies for Worker Lambda
# Based on terraform-skill security-compliance (least privilege)

# Lambda execution role
resource "aws_iam_role" "lambda" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# Basic Lambda execution policy (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB policy - PutItem, GetItem and UpdateItem (least privilege)
resource "aws_iam_policy" "dynamodb" {
  name        = "${var.function_name}-dynamodb"
  description = "DynamoDB PutItem, GetItem and UpdateItem access for Worker"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowDynamoDBReadWrite"
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
      ]
      Resource = [var.dynamodb_table_arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.dynamodb.arn
}

# SQS policy - ReceiveMessage, DeleteMessage (for event source mapping)
resource "aws_iam_policy" "sqs" {
  name        = "${var.function_name}-sqs"
  description = "SQS receive/delete access for Worker Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowSQSReceive"
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility",
      ]
      Resource = [var.sqs_queue_arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sqs" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.sqs.arn
}

# Secrets Manager policy (optional, only if secret ARNs provided)
resource "aws_iam_policy" "secrets" {
  count = length(var.secret_arns) > 0 ? 1 : 0

  name        = "${var.function_name}-secrets"
  description = "Secrets Manager read access for Worker Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowSecretsManagerRead"
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
      ]
      Resource = var.secret_arns
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  count = length(var.secret_arns) > 0 ? 1 : 0

  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.secrets[0].arn
}
