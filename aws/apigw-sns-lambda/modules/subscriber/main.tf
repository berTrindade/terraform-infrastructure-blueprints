# modules/subscriber/main.tf
# SNS Subscriber: SQS Queue + Lambda Consumer
# Implements independent failure domain per consumer
# Based on terraform-skill module-patterns

# Dead Letter Queue (DLQ) - receives failed messages
resource "aws_sqs_queue" "dlq" {
  name = var.dlq_name

  # Long retention for debugging failed messages
  message_retention_seconds = var.dlq_retention_seconds

  # Enable encryption at rest (SQS-managed)
  sqs_managed_sse_enabled = true

  tags = var.tags
}

# Main consumer queue
resource "aws_sqs_queue" "this" {
  name = var.queue_name

  # Message retention
  message_retention_seconds = var.message_retention_seconds

  # Visibility timeout should be > Lambda timeout
  visibility_timeout_seconds = var.visibility_timeout_seconds

  # Enable encryption at rest (SQS-managed)
  sqs_managed_sse_enabled = true

  # Redrive policy - send to DLQ after max receive count
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = var.tags
}

# DLQ redrive allow policy
resource "aws_sqs_queue_redrive_allow_policy" "dlq" {
  queue_url = aws_sqs_queue.dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.this.arn]
  })
}

# SQS Queue Policy - allows SNS to send messages
resource "aws_sqs_queue_policy" "this" {
  queue_url = aws_sqs_queue.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSNSPublish"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.this.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.sns_topic_arn
          }
        }
      }
    ]
  })
}

# SNS Subscription - connects topic to this queue
resource "aws_sns_topic_subscription" "this" {
  topic_arn = var.sns_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.this.arn

  # Enable raw message delivery (no SNS wrapper)
  raw_message_delivery = var.raw_message_delivery

  # Optional: Filter policy for selective delivery
  filter_policy = var.filter_policy != null ? jsonencode(var.filter_policy) : null

  # Scope for filter policy (MessageAttributes or MessageBody)
  filter_policy_scope = var.filter_policy != null ? var.filter_policy_scope : null
}
