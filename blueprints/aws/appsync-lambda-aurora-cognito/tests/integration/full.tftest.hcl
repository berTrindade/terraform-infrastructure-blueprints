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
    project     = "test-appsync-api"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    lambda_memory_size    = 128
    lambda_timeout        = 10
    aurora_min_capacity   = 0.5
    aurora_max_capacity   = 2
    aurora_instance_count = 1

    # Cognito configuration
    cognito_password_minimum_length = 8
    cognito_mfa_configuration       = "OFF"
    cognito_create_domain            = false

    # AppSync configuration
    appsync_log_level     = "ERROR"
    appsync_xray_enabled  = false
    appsync_create_api_key = true

    # Disable production features for testing
    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    # Short retention for cleanup
    log_retention_days           = 1
    secrets_recovery_window_days = 0
  }

  # Verify AppSync API created
  assert {
    condition     = output.appsync_api_id != ""
    error_message = "AppSync API ID should be created"
  }

  # Verify GraphQL endpoint created
  assert {
    condition     = output.appsync_graphql_endpoint != ""
    error_message = "AppSync GraphQL endpoint should be created"
  }

  # Verify Cognito User Pool created
  assert {
    condition     = output.cognito_user_pool_id != ""
    error_message = "Cognito User Pool should be created"
  }

  # Verify Cognito Client created
  assert {
    condition     = output.cognito_user_pool_client_id != ""
    error_message = "Cognito User Pool Client should be created"
  }

  # Verify Lambda function created
  assert {
    condition     = output.lambda_function_name != ""
    error_message = "Lambda function should be created"
  }

  # Verify Aurora cluster created
  assert {
    condition     = output.aurora_cluster_endpoint != ""
    error_message = "Aurora cluster endpoint should be created"
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

    lambda_memory_size    = 128
    lambda_timeout        = 10
    aurora_min_capacity   = 0.5
    aurora_max_capacity   = 2
    aurora_instance_count = 1

    cognito_password_minimum_length = 8
    cognito_mfa_configuration       = "OFF"
    cognito_create_domain            = false

    appsync_log_level     = "ERROR"
    appsync_xray_enabled  = false
    appsync_create_api_key = true

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
    condition     = output.lambda_function_name == "myproject-dev-resolver"
    error_message = "Lambda function should follow naming convention"
  }

  # Verify database name
  assert {
    condition     = output.db_name == "app"
    error_message = "Database name should be 'app'"
  }
}

# ============================================
# Test: Aurora Serverless v2 scaling
# ============================================

run "aurora_serverless_scaling" {
  command = apply

  variables {
    project     = "test-scale"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size    = 128
    lambda_timeout        = 10
    aurora_min_capacity   = 0.5
    aurora_max_capacity   = 4
    aurora_instance_count = 1

    cognito_password_minimum_length = 8
    cognito_mfa_configuration       = "OFF"
    cognito_create_domain            = false

    appsync_log_level     = "ERROR"
    appsync_xray_enabled  = false
    appsync_create_api_key = true

    db_performance_insights_enabled = false
    db_deletion_protection          = false
    db_skip_final_snapshot          = true
    db_apply_immediately            = true
    db_backup_retention_period      = 1

    log_retention_days           = 1
    secrets_recovery_window_days = 0
  }

  # Verify Aurora writer endpoint exists
  assert {
    condition     = output.aurora_cluster_endpoint != ""
    error_message = "Aurora cluster writer endpoint should be available"
  }

  # Verify Aurora endpoints differ
  assert {
    condition     = output.aurora_cluster_endpoint != output.aurora_reader_endpoint
    error_message = "Writer and reader endpoints should differ"
  }
}
