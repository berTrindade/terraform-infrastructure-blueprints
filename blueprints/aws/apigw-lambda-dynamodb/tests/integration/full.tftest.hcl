# tests/integration/full.tftest.hcl
# Integration tests for full deployment
# Based on Terraform native testing framework (1.6+)
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
    project     = "test-ddb-api"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    lambda_memory_size = 128
    lambda_timeout     = 10

    # DynamoDB settings
    dynamodb_billing_mode = "PAY_PER_REQUEST"
    enable_dynamodb_pitr  = false

    # Short retention for cleanup
    log_retention_days = 1
  }

  # Verify API Gateway created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  # Verify Lambda function created
  assert {
    condition     = output.lambda_function_name != ""
    error_message = "Lambda function should be created"
  }

  # Verify DynamoDB table created
  assert {
    condition     = output.dynamodb_table_name != ""
    error_message = "DynamoDB table should be created"
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

    lambda_memory_size    = 128
    lambda_timeout        = 10
    dynamodb_billing_mode = "PAY_PER_REQUEST"
    enable_dynamodb_pitr  = false
    log_retention_days    = 1
  }

  # Verify Lambda naming
  assert {
    condition     = output.lambda_function_name == "myproject-dev-api"
    error_message = "Lambda function should follow naming convention"
  }

  # Verify DynamoDB naming
  assert {
    condition     = output.dynamodb_table_name == "myproject-dev-items"
    error_message = "DynamoDB table should follow naming convention"
  }
}

# ============================================
# Test: DynamoDB with TTL
# ============================================

run "dynamodb_with_ttl" {
  command = apply

  variables {
    project     = "test-ttl"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size     = 128
    lambda_timeout         = 10
    dynamodb_billing_mode  = "PAY_PER_REQUEST"
    enable_dynamodb_pitr   = false
    dynamodb_ttl_attribute = "expiresAt"
    log_retention_days     = 1
  }

  # Verify DynamoDB table created
  assert {
    condition     = output.dynamodb_table_name != ""
    error_message = "DynamoDB table with TTL should be created"
  }
}

# ============================================
# Test: API endpoints
# ============================================

run "api_endpoints" {
  command = apply

  variables {
    project     = "test-ep"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size    = 128
    lambda_timeout        = 10
    dynamodb_billing_mode = "PAY_PER_REQUEST"
    enable_dynamodb_pitr  = false
    log_retention_days    = 1
  }

  # Verify API endpoint format
  assert {
    condition     = can(regex("^https://", output.api_endpoint))
    error_message = "API endpoint should be HTTPS"
  }

  # Verify items endpoint
  assert {
    condition     = can(regex("/items$", output.items_endpoint))
    error_message = "Items endpoint should end with /items"
  }
}
