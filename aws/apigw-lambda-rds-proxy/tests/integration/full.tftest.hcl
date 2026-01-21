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
    project     = "test-proxy-api"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    lambda_memory_size   = 128
    lambda_timeout       = 10
    db_instance_class    = "db.t3.micro"
    db_allocated_storage = 20

    # Proxy settings
    proxy_idle_timeout              = 300
    proxy_connection_borrow_timeout = 60
    proxy_max_connections_percent   = 50

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

  # Verify RDS Proxy created
  assert {
    condition     = output.proxy_endpoint != ""
    error_message = "RDS Proxy endpoint should be created"
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

    proxy_idle_timeout              = 300
    proxy_connection_borrow_timeout = 60
    proxy_max_connections_percent   = 50

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
# Test: RDS Proxy connectivity
# ============================================

run "proxy_connectivity" {
  command = apply

  variables {
    project     = "test-conn"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size   = 128
    lambda_timeout       = 10
    db_instance_class    = "db.t3.micro"
    db_allocated_storage = 20

    proxy_debug_logging             = true
    proxy_idle_timeout              = 300
    proxy_connection_borrow_timeout = 60
    proxy_max_connections_percent   = 50

    db_multi_az                     = false
    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    log_retention_days           = 1
    secrets_recovery_window_days = 0
  }

  # Verify proxy endpoint differs from RDS endpoint
  assert {
    condition     = output.proxy_endpoint != output.db_endpoint
    error_message = "Proxy endpoint should differ from direct RDS endpoint"
  }

  # Verify proxy endpoint contains 'proxy'
  assert {
    condition     = can(regex("proxy", output.proxy_endpoint))
    error_message = "Proxy endpoint should contain 'proxy' in URL"
  }
}
