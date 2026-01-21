# environments/dev/main.tf
# Development environment composition (API Gateway → SQS → Worker)
# Uses official terraform-aws-modules for battle-tested infrastructure

# ============================================
# Naming and Tagging
# ============================================

module "naming" {
  source = "../../modules/naming"

  project     = var.project
  environment = var.environment
}

module "tagging" {
  source = "../../modules/tagging"

  project     = var.project
  environment = var.environment
  repository  = var.repository

  additional_tags = var.additional_tags
}

# ============================================
# Secrets Manager (Flow B shells)
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secret_prefix           = module.naming.secret_prefix
  secrets                 = var.secrets
  recovery_window_in_days = var.secrets_recovery_window_days

  tags = module.tagging.tags
}

# ============================================
# Data Layer: DynamoDB (Official Module)
# ============================================

module "dynamodb" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 4.0"

  name         = module.naming.dynamodb_table
  hash_key     = "id"
  billing_mode = "PAY_PER_REQUEST"

  attributes = [
    {
      name = "id"
      type = "S"
    }
  ]

  server_side_encryption_enabled = true
  point_in_time_recovery_enabled = var.enable_dynamodb_pitr

  ttl_enabled        = var.dynamodb_ttl_attribute != null
  ttl_attribute_name = var.dynamodb_ttl_attribute

  tags = module.tagging.tags
}

# ============================================
# Queue Layer: SQS + DLQ (Official Module)
# ============================================

# Dead Letter Queue
module "dlq" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "~> 4.0"

  name = module.naming.sqs_dlq

  message_retention_seconds   = var.dlq_retention_seconds
  sqs_managed_sse_enabled     = true
  
  tags = module.tagging.tags
}

# Main Queue
module "sqs" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "~> 4.0"

  name = module.naming.sqs_queue

  message_retention_seconds  = var.sqs_retention_seconds
  visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
  sqs_managed_sse_enabled    = true

  # Redrive to DLQ
  create_dlq = false # We create it separately above
  redrive_policy = {
    deadLetterTargetArn = module.dlq.queue_arn
    maxReceiveCount     = var.sqs_max_receive_count
  }

  tags = module.tagging.tags
}

# Allow DLQ to receive from main queue
resource "aws_sqs_queue_redrive_allow_policy" "dlq" {
  queue_url = module.dlq.queue_url

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [module.sqs.queue_arn]
  })
}

# ============================================
# API Layer: API Gateway → SQS
# ============================================

module "api" {
  source = "../../modules/api"

  # API Gateway
  api_name           = module.naming.api_gateway
  role_name          = module.naming.api_role
  cors_allow_origins = var.cors_allow_origins

  # Integration: SQS (direct)
  sqs_queue_url = module.sqs.queue_url
  sqs_queue_arn = module.sqs.queue_arn

  # Observability
  log_retention_days = var.log_retention_days

  tags = module.tagging.tags
}

# ============================================
# Worker Layer: Lambda + SQS Trigger (Official Module)
# ============================================

module "worker_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.worker_lambda
  description   = "Worker - processes commands from SQS and updates DynamoDB"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/worker"

  memory_size = var.worker_memory_size
  timeout     = var.worker_timeout

  reserved_concurrent_executions = var.worker_reserved_concurrency

  environment_variables = merge(
    {
      DYNAMODB_TABLE = module.dynamodb.dynamodb_table_id
    },
    lookup(module.secrets.secret_arns, "external-api-key", null) != null ? {
      EXTERNAL_API_SECRET_ARN = module.secrets.secret_arns["external-api-key"]
    } : {}
  )

  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days

  # IAM permissions
  attach_policy_statements = true
  policy_statements = {
    dynamodb = {
      effect = "Allow"
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ]
      resources = [
        module.dynamodb.dynamodb_table_arn,
        "${module.dynamodb.dynamodb_table_arn}/index/*"
      ]
    }
    sqs = {
      effect = "Allow"
      actions = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ]
      resources = [module.sqs.queue_arn]
    }
    secrets = {
      effect    = "Allow"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = module.secrets.all_secret_arns
    }
  }

  # SQS Event Source Mapping
  event_source_mapping = {
    sqs = {
      event_source_arn        = module.sqs.queue_arn
      batch_size              = var.worker_batch_size
      maximum_batching_window_in_seconds = var.worker_batching_window_seconds
      function_response_types = ["ReportBatchItemFailures"]
      scaling_config = {
        maximum_concurrency = var.worker_max_concurrency
      }
    }
  }

  tags = module.tagging.tags
}
