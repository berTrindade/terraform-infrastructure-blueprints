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
    project        = "test-amplify"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "test-amplify-dev-unique"

    # Cognito settings
    password_minimum_length  = 8
    password_require_symbols = false
    mfa_configuration        = "OFF"

    # Amplify settings
    framework              = "React"
    main_branch_name       = "main"
    build_output_directory = "build"

    # Disable features for testing
    create_identity_pool        = false
    enable_auto_branch_creation = false
    enable_pull_request_preview = false
    create_webhook              = false
  }

  # Verify Amplify app created
  assert {
    condition     = output.amplify_app_id != ""
    error_message = "Amplify app should be created"
  }

  # Verify Amplify default domain
  assert {
    condition     = output.default_domain != ""
    error_message = "Amplify default domain should be created"
  }

  # Verify Cognito User Pool created
  assert {
    condition     = output.user_pool_id != ""
    error_message = "Cognito User Pool should be created"
  }

  # Verify Cognito User Pool Client created
  assert {
    condition     = output.user_pool_client_id != ""
    error_message = "Cognito User Pool Client should be created"
  }

  # Verify Cognito domain created
  assert {
    condition     = output.cognito_domain != ""
    error_message = "Cognito domain should be created"
  }
}

# ============================================
# Test: Amplify app URL format
# ============================================

run "amplify_url_format" {
  command = apply

  variables {
    project        = "test-url"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "test-url-dev-unique"

    password_minimum_length  = 8
    password_require_symbols = false
    mfa_configuration        = "OFF"

    framework              = "React"
    main_branch_name       = "main"
    build_output_directory = "build"

    create_identity_pool        = false
    enable_auto_branch_creation = false
    enable_pull_request_preview = false
    create_webhook              = false
  }

  # Verify Amplify app URL format
  assert {
    condition     = can(regex("^https://", output.app_url))
    error_message = "Amplify app URL should be HTTPS"
  }

  # Verify Amplify default domain format
  assert {
    condition     = can(regex("\\.amplifyapp\\.com$", output.default_domain))
    error_message = "Default domain should be in amplifyapp.com"
  }
}

# ============================================
# Test: Cognito hosted UI
# ============================================

run "cognito_hosted_ui" {
  command = apply

  variables {
    project        = "test-ui"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "test-ui-dev-unique"

    password_minimum_length  = 8
    password_require_symbols = false
    mfa_configuration        = "OFF"

    framework              = "React"
    main_branch_name       = "main"
    build_output_directory = "build"

    create_identity_pool        = false
    enable_auto_branch_creation = false
    enable_pull_request_preview = false
    create_webhook              = false
  }

  # Verify hosted UI URL format
  assert {
    condition     = can(regex("^https://.*\\.auth\\..*\\.amazoncognito\\.com", output.hosted_ui_url))
    error_message = "Hosted UI URL should have correct format"
  }
}
