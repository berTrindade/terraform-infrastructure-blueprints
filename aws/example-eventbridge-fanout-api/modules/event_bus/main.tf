# modules/event_bus/main.tf
# EventBridge Custom Event Bus with Archive
# Based on terraform-skill security-compliance patterns

# Custom Event Bus
resource "aws_cloudwatch_event_bus" "this" {
  name = var.bus_name

  tags = var.tags
}

# Event Archive (for replay capability)
resource "aws_cloudwatch_event_archive" "this" {
  count = var.enable_archive ? 1 : 0

  name             = var.archive_name
  event_source_arn = aws_cloudwatch_event_bus.this.arn
  description      = "Archive for ${var.bus_name} events"

  # Retention period (0 = indefinite)
  retention_days = var.archive_retention_days

  # Optional: Filter which events to archive
  event_pattern = var.archive_event_pattern
}

# Resource policy for the event bus
resource "aws_cloudwatch_event_bus_policy" "this" {
  count = var.enable_policy ? 1 : 0

  event_bus_name = aws_cloudwatch_event_bus.this.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPutEventsFromAccount"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "events:PutEvents"
        Resource = aws_cloudwatch_event_bus.this.arn
      }
    ]
  })
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
