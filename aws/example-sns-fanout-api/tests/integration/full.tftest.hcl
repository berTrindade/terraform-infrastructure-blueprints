# tests/integration/full.tftest.hcl
# Integration tests for full deployment (API Gateway → SNS → Subscribers)
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
    project     = "test-sns-fanout"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    consumer_memory_size = 128
    consumer_timeout     = 10

    # Short retention for cleanup
    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1
  }

  # Verify API Gateway created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  # Verify SNS topic created
  assert {
    condition     = output.sns_topic_arn != ""
    error_message = "SNS topic should be created"
  }

  # Verify PDF Generator subscriber created
  assert {
    condition     = output.pdf_generator_queue_url != ""
    error_message = "PDF generator queue should be created"
  }

  assert {
    condition     = output.pdf_generator_function_name != ""
    error_message = "PDF generator Lambda should be created"
  }

  # Verify Audit Logger subscriber created
  assert {
    condition     = output.audit_logger_queue_url != ""
    error_message = "Audit logger queue should be created"
  }

  assert {
    condition     = output.audit_logger_function_name != ""
    error_message = "Audit logger Lambda should be created"
  }

  # Verify Notifier subscriber created
  assert {
    condition     = output.notifier_queue_url != ""
    error_message = "Notifier queue should be created"
  }

  assert {
    condition     = output.notifier_function_name != ""
    error_message = "Notifier Lambda should be created"
  }
}

# ============================================
# Test: Deployment with notifier filter policy
# ============================================

run "deployment_with_filter_policy" {
  command = apply

  variables {
    project     = "test-filter"
    environment = "dev"
    aws_region  = "us-east-1"

    consumer_memory_size = 128
    consumer_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    # Add filter policy to notifier
    notifier_filter_policy = {
      eventType = ["ReportRequested"]
    }
  }

  # Verify all components created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  assert {
    condition     = output.notifier_function_name != ""
    error_message = "Notifier should be created with filter policy"
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

    consumer_memory_size = 128
    consumer_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1
  }

  # Verify SNS topic naming
  assert {
    condition     = output.sns_topic_name == "myproject-dev-events"
    error_message = "SNS topic should follow naming convention"
  }

  # Verify PDF Generator naming
  assert {
    condition     = output.pdf_generator_function_name == "myproject-dev-pdf-generator"
    error_message = "PDF Generator should follow naming convention"
  }

  # Verify Audit Logger naming
  assert {
    condition     = output.audit_logger_function_name == "myproject-dev-audit-logger"
    error_message = "Audit Logger should follow naming convention"
  }

  # Verify Notifier naming
  assert {
    condition     = output.notifier_function_name == "myproject-dev-notifier"
    error_message = "Notifier should follow naming convention"
  }
}

# ============================================
# Test: Fan-out architecture (3 independent subscribers)
# ============================================

run "fanout_architecture" {
  command = apply

  variables {
    project     = "fanout-test"
    environment = "dev"
    aws_region  = "us-east-1"

    consumer_memory_size = 128
    consumer_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1
  }

  # Verify 3 separate queues (independent failure domains)
  assert {
    condition     = output.pdf_generator_queue_url != output.audit_logger_queue_url
    error_message = "PDF and Audit queues should be different"
  }

  assert {
    condition     = output.audit_logger_queue_url != output.notifier_queue_url
    error_message = "Audit and Notifier queues should be different"
  }

  # Verify 3 separate DLQs
  assert {
    condition     = output.pdf_generator_dlq_url != output.audit_logger_dlq_url
    error_message = "PDF and Audit DLQs should be different"
  }
}
