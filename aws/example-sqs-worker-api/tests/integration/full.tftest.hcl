# tests/integration/full.tftest.hcl
# Integration tests for full deployment (API Gateway → SQS → Worker)
# Based on terraform-skill testing-frameworks (native Terraform tests 1.6+)
#
# WARNING: These tests create real AWS resources!
# Run with: terraform test -filter=tests/integration/full.tftest.hcl
# Requires AWS credentials with appropriate permissions.

# ============================================
# Provider configuration
# ============================================

provider "aws" {
  region = "us-east-1"
}

# ============================================
# Test: Full deployment with default values
# ============================================

run "full_deployment" {
  command = apply

  variables {
    project     = "test-sqs-worker"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    worker_memory_size = 128
    worker_timeout     = 10

    # Short retention for cleanup
    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    # No secrets for basic test
    secrets = {}
  }

  # Verify API Gateway created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  # Verify DynamoDB table created
  assert {
    condition     = output.dynamodb_table_name != ""
    error_message = "DynamoDB table should be created"
  }

  # Verify SQS queue created
  assert {
    condition     = output.sqs_queue_url != ""
    error_message = "SQS queue should be created"
  }

  # Verify DLQ created
  assert {
    condition     = output.sqs_dlq_url != ""
    error_message = "SQS DLQ should be created"
  }

  # Verify Worker Lambda created
  assert {
    condition     = output.worker_function_name != ""
    error_message = "Worker Lambda should be created"
  }
}

# ============================================
# Test: Deployment with secrets
# ============================================

run "deployment_with_secrets" {
  command = apply

  variables {
    project     = "test-secrets"
    environment = "dev"
    aws_region  = "us-east-1"

    worker_memory_size = 128
    worker_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    secrets = {
      "test-api-key" = {
        description = "Test API key for integration testing"
      }
    }
  }

  # Verify secrets created
  assert {
    condition     = length(output.secret_arns) > 0
    error_message = "Secrets should be created"
  }

  # Verify secret has correct prefix
  assert {
    condition     = can(regex("/dev/test-secrets/", values(output.secret_names)[0]))
    error_message = "Secret should have correct prefix"
  }
}

# ============================================
# Test: Naming convention
# ============================================

run "naming_convention" {
  command = apply

  variables {
    project     = "myproject"
    environment = "dev"
    aws_region  = "us-east-1"

    worker_memory_size = 128
    worker_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    secrets = {}
  }

  # Verify DynamoDB naming
  assert {
    condition     = output.dynamodb_table_name == "myproject-dev-commands"
    error_message = "DynamoDB table should follow naming convention"
  }

  # Verify Worker Lambda naming
  assert {
    condition     = output.worker_function_name == "myproject-dev-worker"
    error_message = "Worker should follow naming convention"
  }
}
