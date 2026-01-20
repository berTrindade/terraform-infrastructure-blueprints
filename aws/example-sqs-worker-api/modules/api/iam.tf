# modules/api/iam.tf
# IAM role for API Gateway to send messages to SQS
# Based on terraform-skill security-compliance (least privilege)

# API Gateway execution role for SQS integration
resource "aws_iam_role" "api_gateway" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# SQS policy - SendMessage only (least privilege)
resource "aws_iam_policy" "sqs" {
  name        = "${var.api_name}-sqs"
  description = "SQS SendMessage access for API Gateway"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowSQSSendMessage"
      Effect = "Allow"
      Action = [
        "sqs:SendMessage",
      ]
      Resource = [var.sqs_queue_arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_sqs" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.sqs.arn
}
