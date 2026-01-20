# modules/api/iam.tf
# IAM role for API Gateway to publish to SNS
# Based on terraform-skill security-compliance patterns

# API Gateway role for SNS integration
resource "aws_iam_role" "api_gateway" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Policy to allow API Gateway to publish to SNS
resource "aws_iam_policy" "api_gateway_sns" {
  name        = "${var.role_name}-sns"
  description = "Allow API Gateway to publish to SNS topic"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.sns_topic_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_sns" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.api_gateway_sns.arn
}

# CloudWatch Logs policy for API Gateway
resource "aws_iam_policy" "api_gateway_logs" {
  name        = "${var.role_name}-logs"
  description = "Allow API Gateway to write logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_logs" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.api_gateway_logs.arn
}
