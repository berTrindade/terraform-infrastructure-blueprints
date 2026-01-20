# environments/dev/terraform.tfvars
# Development environment values

project     = "sns-fanout"
environment = "dev"
aws_region  = "us-east-1"

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

# Notifier filter policy (null = receive all events)
# Uncomment to filter to specific event types:
# notifier_filter_policy = {
#   eventType = ["ReportRequested", "ReportGenerated"]
# }

# Optional: Notification webhooks
# notification_webhook = "https://example.com/webhook"
# slack_webhook = "https://hooks.slack.com/services/..."

# Observability
log_retention_days = 14
