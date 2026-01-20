# modules/worker/main.tf
# SQS event source mapping for Worker Lambda
# Based on terraform-skill module-patterns

# SQS event source mapping
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.this.arn
  enabled          = true

  # Batch settings
  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = var.batching_window_seconds

  # Error handling
  function_response_types = ["ReportBatchItemFailures"]

  # Scaling configuration
  scaling_config {
    maximum_concurrency = var.max_concurrency
  }
}
