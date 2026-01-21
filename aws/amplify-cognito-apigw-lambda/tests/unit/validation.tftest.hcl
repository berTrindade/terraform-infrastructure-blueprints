# tests/unit/validation.tftest.hcl
# Unit tests for input validation
# Based on Terraform native testing framework (1.6+)
#
# Run with: terraform test -filter=tests/unit/

# ============================================
# Mock providers (no AWS calls)
# ============================================

mock_provider "aws" {}

# ============================================
# Test: Valid project name
# ============================================

run "valid_project_name" {
  command = plan

  variables {
    project        = "my-app"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "my-app-dev"
  }

  assert {
    condition     = var.project == "my-app"
    error_message = "Project name should be accepted"
  }
}

# ============================================
# Test: Valid environment values
# ============================================

run "valid_environment_dev" {
  command = plan

  variables {
    project        = "test-app"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "test-app-dev"
  }

  assert {
    condition     = var.environment == "dev"
    error_message = "Environment 'dev' should be accepted"
  }
}

run "valid_environment_staging" {
  command = plan

  variables {
    project        = "test-app"
    environment    = "staging"
    aws_region     = "us-east-1"
    cognito_domain = "test-app-staging"
  }

  assert {
    condition     = var.environment == "staging"
    error_message = "Environment 'staging' should be accepted"
  }
}

run "valid_environment_prod" {
  command = plan

  variables {
    project        = "test-app"
    environment    = "prod"
    aws_region     = "us-east-1"
    cognito_domain = "test-app-prod"
  }

  assert {
    condition     = var.environment == "prod"
    error_message = "Environment 'prod' should be accepted"
  }
}

# ============================================
# Test: Cognito configuration
# ============================================

run "valid_cognito_config" {
  command = plan

  variables {
    project                  = "test-app"
    environment              = "dev"
    aws_region               = "us-east-1"
    cognito_domain           = "test-app-dev"
    password_minimum_length  = 12
    password_require_symbols = true
    mfa_configuration        = "OPTIONAL"
  }

  assert {
    condition     = var.password_minimum_length == 12
    error_message = "Password minimum length should be accepted"
  }

  assert {
    condition     = var.password_require_symbols == true
    error_message = "Password require symbols should be accepted"
  }

  assert {
    condition     = var.mfa_configuration == "OPTIONAL"
    error_message = "MFA configuration should be accepted"
  }
}

run "cognito_token_validity" {
  command = plan

  variables {
    project                = "test-app"
    environment            = "dev"
    aws_region             = "us-east-1"
    cognito_domain         = "test-app-dev"
    access_token_validity  = 2
    id_token_validity      = 2
    refresh_token_validity = 7
  }

  assert {
    condition     = var.access_token_validity == 2
    error_message = "Access token validity should be accepted"
  }

  assert {
    condition     = var.id_token_validity == 2
    error_message = "ID token validity should be accepted"
  }

  assert {
    condition     = var.refresh_token_validity == 7
    error_message = "Refresh token validity should be accepted"
  }
}

# ============================================
# Test: Amplify configuration
# ============================================

run "valid_amplify_config" {
  command = plan

  variables {
    project                = "test-app"
    environment            = "dev"
    aws_region             = "us-east-1"
    cognito_domain         = "test-app-dev"
    framework              = "React"
    main_branch_name       = "main"
    build_output_directory = "dist"
  }

  assert {
    condition     = var.framework == "React"
    error_message = "Framework should be accepted"
  }

  assert {
    condition     = var.main_branch_name == "main"
    error_message = "Main branch name should be accepted"
  }

  assert {
    condition     = var.build_output_directory == "dist"
    error_message = "Build output directory should be accepted"
  }
}

run "amplify_branch_config" {
  command = plan

  variables {
    project                     = "test-app"
    environment                 = "dev"
    aws_region                  = "us-east-1"
    cognito_domain              = "test-app-dev"
    enable_auto_branch_creation = true
    enable_branch_auto_build    = true
    enable_branch_auto_deletion = true
    enable_pull_request_preview = true
  }

  assert {
    condition     = var.enable_auto_branch_creation == true
    error_message = "Auto branch creation should be accepted"
  }

  assert {
    condition     = var.enable_pull_request_preview == true
    error_message = "PR preview should be accepted"
  }
}

run "amplify_environment_variables" {
  command = plan

  variables {
    project        = "test-app"
    environment    = "dev"
    aws_region     = "us-east-1"
    cognito_domain = "test-app-dev"
    environment_variables = {
      "NODE_ENV"  = "production"
      "API_URL"   = "https://api.example.com"
    }
  }

  assert {
    condition     = length(var.environment_variables) == 2
    error_message = "Environment variables should be accepted"
  }
}

# ============================================
# Test: Identity pool
# ============================================

run "with_identity_pool" {
  command = plan

  variables {
    project              = "test-app"
    environment          = "dev"
    aws_region           = "us-east-1"
    cognito_domain       = "test-app-dev"
    create_identity_pool = true
  }

  assert {
    condition     = var.create_identity_pool == true
    error_message = "Identity pool creation should be accepted"
  }
}
