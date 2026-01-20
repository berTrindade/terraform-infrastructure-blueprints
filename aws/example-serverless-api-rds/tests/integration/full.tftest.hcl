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
    project     = "test-rds-api"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    lambda_memory_size   = 128
    lambda_timeout       = 10
    db_instance_class    = "db.t3.micro"
    db_allocated_storage = 20

    # Disable production features for testing
    db_multi_az                     = false
    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    # Short retention for cleanup
    log_retention_days           = 1
    secrets_recovery_window_days = 0
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

  # Verify RDS created
  assert {
    condition     = output.db_endpoint != ""
    error_message = "RDS endpoint should be created"
  }

  # Verify VPC created
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC should be created"
  }

  # Verify secrets created
  assert {
    condition     = output.db_secret_arn != ""
    error_message = "Database secret should be created"
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

    lambda_memory_size   = 128
    lambda_timeout       = 10
    db_instance_class    = "db.t3.micro"
    db_allocated_storage = 20

    db_multi_az                     = false
    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    log_retention_days           = 1
    secrets_recovery_window_days = 0
  }

  # Verify Lambda naming
  assert {
    condition     = output.lambda_function_name == "myproject-dev-api"
    error_message = "Lambda function should follow naming convention"
  }

  # Verify database name
  assert {
    condition     = output.db_name == "app"
    error_message = "Database name should be 'app'"
  }
}

# ============================================
# Test: Custom database configuration
# ============================================

run "custom_db_config" {
  command = apply

  variables {
    project     = "test-custom"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size = 128
    lambda_timeout     = 10

    db_name              = "customdb"
    db_username          = "admin"
    db_instance_class    = "db.t3.micro"
    db_allocated_storage = 30

    db_multi_az                     = false
    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    log_retention_days           = 1
    secrets_recovery_window_days = 0
  }

  # Verify custom database name
  assert {
    condition     = output.db_name == "customdb"
    error_message = "Custom database name should be used"
  }

  # Verify RDS endpoint exists
  assert {
    condition     = output.db_host != ""
    error_message = "Database host should be available"
  }
}
