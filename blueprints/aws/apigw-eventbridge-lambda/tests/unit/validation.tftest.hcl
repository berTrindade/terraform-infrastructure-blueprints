# tests/unit/validation.tftest.hcl
# Unit tests for input validation (API Gateway → EventBridge → Consumers)
# Based on terraform-skill testing-frameworks (native Terraform tests 1.6+)

# ============================================
# Mock providers (no AWS calls)
# ============================================

mock_provider "aws" {}
mock_provider "archive" {}

# ============================================
# Test: Valid project name
# ============================================

run "valid_project_name" {
  command = plan

  variables {
    project     = "my-eb-fanout"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.project == "my-eb-fanout"
    error_message = "Project name should be accepted"
  }
}

# ============================================
# Test: Invalid project name (uppercase)
# ============================================

run "invalid_project_name_uppercase" {
  command = plan

  variables {
    project     = "MyEBFanout"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.project]
}

# ============================================
# Test: Invalid project name (starts with number)
# ============================================

run "invalid_project_name_starts_with_number" {
  command = plan

  variables {
    project     = "123ebfanout"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.project]
}

# ============================================
# Test: Valid environment values
# ============================================

run "valid_environment_dev" {
  command = plan

  variables {
    project     = "test-eb-fanout"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "dev"
    error_message = "Environment 'dev' should be accepted"
  }
}

run "valid_environment_staging" {
  command = plan

  variables {
    project     = "test-eb-fanout"
    environment = "staging"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "staging"
    error_message = "Environment 'staging' should be accepted"
  }
}

run "valid_environment_prod" {
  command = plan

  variables {
    project     = "test-eb-fanout"
    environment = "prod"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "prod"
    error_message = "Environment 'prod' should be accepted"
  }
}

# ============================================
# Test: Invalid environment value
# ============================================

run "invalid_environment" {
  command = plan

  variables {
    project     = "test-eb-fanout"
    environment = "production"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.environment]
}

# ============================================
# Test: Consumer memory size validation
# ============================================

run "valid_consumer_memory_size" {
  command = plan

  variables {
    project              = "test-eb-fanout"
    environment          = "dev"
    aws_region           = "us-east-1"
    consumer_memory_size = 512
  }

  assert {
    condition     = var.consumer_memory_size == 512
    error_message = "Consumer memory size 512 should be accepted"
  }
}

run "invalid_consumer_memory_size_too_small" {
  command = plan

  variables {
    project              = "test-eb-fanout"
    environment          = "dev"
    aws_region           = "us-east-1"
    consumer_memory_size = 64
  }

  expect_failures = [var.consumer_memory_size]
}

# ============================================
# Test: Consumer timeout validation
# ============================================

run "valid_consumer_timeout" {
  command = plan

  variables {
    project          = "test-eb-fanout"
    environment      = "dev"
    aws_region       = "us-east-1"
    consumer_timeout = 60
  }

  assert {
    condition     = var.consumer_timeout == 60
    error_message = "Consumer timeout 60 should be accepted"
  }
}

run "invalid_consumer_timeout_too_large" {
  command = plan

  variables {
    project          = "test-eb-fanout"
    environment      = "dev"
    aws_region       = "us-east-1"
    consumer_timeout = 1000
  }

  expect_failures = [var.consumer_timeout]
}

# ============================================
# Test: SQS retention validation
# ============================================

run "valid_sqs_retention" {
  command = plan

  variables {
    project               = "test-eb-fanout"
    environment           = "dev"
    aws_region            = "us-east-1"
    sqs_retention_seconds = 604800 # 7 days
  }

  assert {
    condition     = var.sqs_retention_seconds == 604800
    error_message = "SQS retention 7 days should be accepted"
  }
}

run "invalid_sqs_retention_too_long" {
  command = plan

  variables {
    project               = "test-eb-fanout"
    environment           = "dev"
    aws_region            = "us-east-1"
    sqs_retention_seconds = 2000000 # > 14 days
  }

  expect_failures = [var.sqs_retention_seconds]
}

# ============================================
# Test: Log retention validation
# ============================================

run "valid_log_retention" {
  command = plan

  variables {
    project            = "test-eb-fanout"
    environment        = "dev"
    aws_region         = "us-east-1"
    log_retention_days = 30
  }

  assert {
    condition     = var.log_retention_days == 30
    error_message = "Log retention 30 days should be accepted"
  }
}

run "invalid_log_retention" {
  command = plan

  variables {
    project            = "test-eb-fanout"
    environment        = "dev"
    aws_region         = "us-east-1"
    log_retention_days = 15 # Not a valid CloudWatch value
  }

  expect_failures = [var.log_retention_days]
}

# ============================================
# Test: EventBridge archive configuration
# ============================================

run "archive_enabled" {
  command = plan

  variables {
    project                = "test-eb-fanout"
    environment            = "dev"
    aws_region             = "us-east-1"
    enable_archive         = true
    archive_retention_days = 30
  }

  assert {
    condition     = var.enable_archive == true
    error_message = "Archive should be enabled"
  }

  assert {
    condition     = var.archive_retention_days == 30
    error_message = "Archive retention should be 30 days"
  }
}

run "archive_disabled" {
  command = plan

  variables {
    project        = "test-eb-fanout"
    environment    = "dev"
    aws_region     = "us-east-1"
    enable_archive = false
  }

  assert {
    condition     = var.enable_archive == false
    error_message = "Archive should be disabled"
  }
}
