# modules/topic/main.tf
# SNS Topic for event fan-out
# Based on terraform-skill security-compliance patterns

# SNS Topic
resource "aws_sns_topic" "this" {
  name = var.topic_name

  # Enable encryption at rest using AWS managed key
  kms_master_key_id = var.kms_key_id != null ? var.kms_key_id : "alias/aws/sns"

  tags = var.tags
}

# SNS Topic Policy - allows SQS subscriptions
resource "aws_sns_topic_policy" "this" {
  arn = aws_sns_topic.this.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "${var.topic_name}-policy"
    Statement = [
      {
        Sid    = "AllowSQSSubscription"
        Effect = "Allow"
        Principal = {
          Service = "sqs.amazonaws.com"
        }
        Action   = "sns:Subscribe"
        Resource = aws_sns_topic.this.arn
        Condition = {
          StringEquals = {
            "AWS:SourceOwner" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AllowPublishFromAPIGateway"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.this.arn
      }
    ]
  })
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
