# environments/dev/terraform.tfvars
# Development environment values

project     = "eb-fanout"
environment = "dev"
aws_region  = "us-east-1"

# EventBridge
event_source           = "reports.api"
enable_archive         = true
archive_retention_days = 7

# API Gateway
cors_allow_origins = ["*"]

# Consumer Lambda configuration
consumer_memory_size = 256
consumer_timeout     = 30

# SQS configuration
sqs_retention_seconds          = 86400   # 1 day
dlq_retention_seconds          = 1209600 # 14 days
sqs_visibility_timeout_seconds = 60
sqs_max_receive_count          = 3

# Consumer scaling
consumer_batch_size              = 10
consumer_batching_window_seconds = 0
consumer_max_concurrency         = 10

# Notifier event pattern (default: all notification-worthy events)
# Uncomment to customize with content-based filtering:
# notifier_event_pattern = <<EOF
# {
#   "source": ["reports.api"],
#   "detail-type": ["ReportRequested"],
#   "detail": {
#     "reportType": ["monthly-summary", "annual-report"]
#   }
# }
# EOF

# Optional: Notification webhooks
# notification_webhook = "https://example.com/webhook"
# slack_webhook = "https://hooks.slack.com/services/..."

# Observability
log_retention_days = 14
