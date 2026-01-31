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
mock_provider "random" {}

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
# Test: Aurora Serverless v2 configuration
# ============================================

run "valid_aurora_config" {
  command = plan

  variables {
    project               = "test-api"
    environment           = "dev"
    aws_region            = "us-east-1"
    aurora_min_capacity   = 0.5
    aurora_max_capacity   = 8
    aurora_instance_count = 2
  }

  assert {
    condition     = var.aurora_min_capacity == 0.5
    error_message = "Aurora min capacity 0.5 should be accepted"
  }

  assert {
    condition     = var.aurora_max_capacity == 8
    error_message = "Aurora max capacity 8 should be accepted"
  }

  assert {
    condition     = var.aurora_instance_count == 2
    error_message = "Aurora instance count 2 should be accepted"
  }
}

# ============================================
# Test: Aurora capacity range
# ============================================

run "aurora_max_capacity_high" {
  command = plan

  variables {
    project             = "test-api"
    environment         = "dev"
    aws_region          = "us-east-1"
    aurora_min_capacity = 0.5
    aurora_max_capacity = 128
  }

  assert {
    condition     = var.aurora_max_capacity == 128
    error_message = "Aurora max capacity 128 (maximum) should be accepted"
  }
}

# ============================================
# Test: VPC configuration
# ============================================

run "valid_vpc_config" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
    aws_region  = "us-east-1"
    vpc_cidr    = "172.16.0.0/16"
    az_count    = 3
  }

  assert {
    condition     = var.vpc_cidr == "172.16.0.0/16"
    error_message = "Custom VPC CIDR should be accepted"
  }

  assert {
    condition     = var.az_count == 3
    error_message = "AZ count 3 should be accepted"
  }
}
