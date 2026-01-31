# tests/integration/full.tftest.hcl
# Integration tests for full deployment (API Gateway → EventBridge → Consumers)
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
    project     = "test-eb-fanout"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    consumer_memory_size = 128
    consumer_timeout     = 10

    # Short retention for cleanup
    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    # Enable archive for testing
    enable_archive         = true
    archive_retention_days = 1
  }

  # Verify API Gateway created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  # Verify EventBridge bus created
  assert {
    condition     = output.event_bus_arn != ""
    error_message = "EventBridge bus should be created"
  }

  # Verify archive created
  assert {
    condition     = output.archive_arn != null
    error_message = "Event archive should be created"
  }

  # Verify PDF Generator consumer created
  assert {
    condition     = output.pdf_generator_queue_url != ""
    error_message = "PDF generator queue should be created"
  }

  assert {
    condition     = output.pdf_generator_function_name != ""
    error_message = "PDF generator Lambda should be created"
  }

  assert {
    condition     = output.pdf_generator_rule_arn != ""
    error_message = "PDF generator EventBridge rule should be created"
  }

  # Verify Audit Logger consumer created
  assert {
    condition     = output.audit_logger_queue_url != ""
    error_message = "Audit logger queue should be created"
  }

  assert {
    condition     = output.audit_logger_function_name != ""
    error_message = "Audit logger Lambda should be created"
  }

  assert {
    condition     = output.audit_logger_rule_arn != ""
    error_message = "Audit logger EventBridge rule should be created"
  }

  # Verify Notifier consumer created
  assert {
    condition     = output.notifier_queue_url != ""
    error_message = "Notifier queue should be created"
  }

  assert {
    condition     = output.notifier_function_name != ""
    error_message = "Notifier Lambda should be created"
  }

  assert {
    condition     = output.notifier_rule_arn != ""
    error_message = "Notifier EventBridge rule should be created"
  }
}

# ============================================
# Test: Deployment without archive
# ============================================

run "deployment_without_archive" {
  command = apply

  variables {
    project     = "test-no-archive"
    environment = "dev"
    aws_region  = "us-east-1"

    consumer_memory_size = 128
    consumer_timeout     = 10

    sqs_retention_seconds = 60
    dlq_retention_seconds = 60
    log_retention_days    = 1

    # Disable archive
    enable_archive = false
  }

  # Verify bus created
  assert {
    condition     = output.event_bus_arn != ""
    error_message = "EventBridge bus should be created"
  }

  # Verify archive not created
  assert {
    condition     = output.archive_arn == null
    error_message = "Archive should not be created when disabled"
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

    enable_archive = false
  }

  # Verify EventBridge bus naming
  assert {
    condition     = output.event_bus_name == "myproject-dev-bus"
    error_message = "EventBridge bus should follow naming convention"
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
# Test: Fan-out architecture (3 independent consumers with rules)
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

    enable_archive = false
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

  # Verify 3 separate EventBridge rules
  assert {
    condition     = output.pdf_generator_rule_arn != output.audit_logger_rule_arn
    error_message = "PDF and Audit rules should be different"
  }

  assert {
    condition     = output.audit_logger_rule_arn != output.notifier_rule_arn
    error_message = "Audit and Notifier rules should be different"
  }

  # Verify 3 separate DLQs
  assert {
    condition     = output.pdf_generator_dlq_url != output.audit_logger_dlq_url
    error_message = "PDF and Audit DLQs should be different"
  }
}
