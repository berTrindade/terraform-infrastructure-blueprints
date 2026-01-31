# tests/unit/validation.tftest.hcl
# Unit tests for input validation
# Based on Terraform native testing framework (1.6+)
#
# Run with: terraform test -filter=tests/unit/

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
    project     = "my-api"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.project == "my-api"
    error_message = "Project name should be accepted"
  }
}

# ============================================
# Test: Invalid project name (uppercase)
# ============================================

run "invalid_project_name_uppercase" {
  command = plan

  variables {
    project     = "MyApi"
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
    project     = "123api"
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
    project     = "test-api"
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
    project     = "test-api"
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
    project     = "test-api"
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
    project     = "test-api"
    environment = "production"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.environment]
}

# ============================================
# Test: Lambda configuration
# ============================================

run "valid_lambda_config" {
  command = plan

  variables {
    project            = "test-api"
    environment        = "dev"
    aws_region         = "us-east-1"
    lambda_memory_size = 512
    lambda_timeout     = 60
  }

  assert {
    condition     = var.lambda_memory_size == 512
    error_message = "Lambda memory size 512 should be accepted"
  }

  assert {
    condition     = var.lambda_timeout == 60
    error_message = "Lambda timeout 60 should be accepted"
  }
}

# ============================================
# Test: DynamoDB configuration
# ============================================

run "valid_dynamodb_config" {
  command = plan

  variables {
    project               = "test-api"
    environment           = "dev"
    aws_region            = "us-east-1"
    dynamodb_billing_mode = "PAY_PER_REQUEST"
    enable_dynamodb_pitr  = true
  }

  assert {
    condition     = var.dynamodb_billing_mode == "PAY_PER_REQUEST"
    error_message = "DynamoDB billing mode should be accepted"
  }

  assert {
    condition     = var.enable_dynamodb_pitr == true
    error_message = "DynamoDB PITR should be accepted"
  }
}

run "dynamodb_with_ttl" {
  command = plan

  variables {
    project                = "test-api"
    environment            = "dev"
    aws_region             = "us-east-1"
    dynamodb_ttl_attribute = "expiresAt"
  }

  assert {
    condition     = var.dynamodb_ttl_attribute == "expiresAt"
    error_message = "DynamoDB TTL attribute should be accepted"
  }
}

# ============================================
# Test: Log retention
# ============================================

run "valid_log_retention" {
  command = plan

  variables {
    project            = "test-api"
    environment        = "dev"
    aws_region         = "us-east-1"
    log_retention_days = 30
  }

  assert {
    condition     = var.log_retention_days == 30
    error_message = "Log retention 30 should be accepted"
  }
}
