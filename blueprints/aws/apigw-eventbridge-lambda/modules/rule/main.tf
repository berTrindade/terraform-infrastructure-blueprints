# modules/rule/main.tf
# EventBridge Rule with SQS Target
# Routes events from bus to per-consumer SQS queue

# EventBridge Rule
resource "aws_cloudwatch_event_rule" "this" {
  name           = var.rule_name
  description    = var.description
  event_bus_name = var.event_bus_name

  # Event pattern for routing
  event_pattern = var.event_pattern

  # Rule state
  state = var.enabled ? "ENABLED" : "DISABLED"

  tags = var.tags
}

# SQS Target
resource "aws_cloudwatch_event_target" "sqs" {
  rule           = aws_cloudwatch_event_rule.this.name
  event_bus_name = var.event_bus_name
  target_id      = var.target_id
  arn            = var.sqs_queue_arn

  # Optional: Input transformation
  dynamic "input_transformer" {
    for_each = var.input_template != null ? [1] : []
    content {
      input_paths    = var.input_paths
      input_template = var.input_template
    }
  }

  # Retry policy
  retry_policy {
    maximum_event_age_in_seconds = var.max_event_age_seconds
    maximum_retry_attempts       = var.max_retry_attempts
  }

  # DLQ for failed event delivery
  dynamic "dead_letter_config" {
    for_each = var.dlq_arn != null ? [1] : []
    content {
      arn = var.dlq_arn
    }
  }
}

# SQS Queue Policy - allows EventBridge to send messages
resource "aws_sqs_queue_policy" "eventbridge" {
  queue_url = var.sqs_queue_url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeSend"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = var.sqs_queue_arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.this.arn
          }
        }
      }
    ]
  })
}
