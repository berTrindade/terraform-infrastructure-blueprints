# modules/queue/main.tf
# SQS queue with DLQ for reliable async processing
# Based on terraform-skill security-compliance patterns

# Dead Letter Queue (DLQ) - receives failed messages
resource "aws_sqs_queue" "dlq" {
  name = var.dlq_name

  # Long retention for debugging failed messages
  message_retention_seconds = var.dlq_retention_seconds

  # Enable encryption at rest (SQS-managed)
  sqs_managed_sse_enabled = true

  tags = var.tags
}

# Main work queue
resource "aws_sqs_queue" "this" {
  name = var.queue_name

  # Message retention
  message_retention_seconds = var.message_retention_seconds

  # Visibility timeout should be > Lambda timeout
  visibility_timeout_seconds = var.visibility_timeout_seconds

  # Delay before message becomes visible (optional)
  delay_seconds = var.delay_seconds

  # Enable encryption at rest (SQS-managed)
  sqs_managed_sse_enabled = true

  # Redrive policy - send to DLQ after max receive count
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = var.tags
}

# DLQ redrive allow policy - allows main queue to send to DLQ
resource "aws_sqs_queue_redrive_allow_policy" "dlq" {
  queue_url = aws_sqs_queue.dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.this.arn]
  })
}
