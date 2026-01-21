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
# Test: ECS task configuration
# ============================================

run "valid_task_config" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
    aws_region  = "us-east-1"
    task_cpu    = 512
    task_memory = 1024
  }

  assert {
    condition     = var.task_cpu == 512
    error_message = "Task CPU should be accepted"
  }

  assert {
    condition     = var.task_memory == 1024
    error_message = "Task memory should be accepted"
  }
}

run "large_task_config" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
    aws_region  = "us-east-1"
    task_cpu    = 4096
    task_memory = 8192
  }

  assert {
    condition     = var.task_cpu == 4096
    error_message = "Large task CPU should be accepted"
  }

  assert {
    condition     = var.task_memory == 8192
    error_message = "Large task memory should be accepted"
  }
}

# ============================================
# Test: ECS service configuration
# ============================================

run "valid_service_config" {
  command = plan

  variables {
    project          = "test-api"
    environment      = "dev"
    aws_region       = "us-east-1"
    desired_count    = 3
    container_port   = 8080
    health_check_path = "/api/health"
  }

  assert {
    condition     = var.desired_count == 3
    error_message = "Desired count should be accepted"
  }

  assert {
    condition     = var.container_port == 8080
    error_message = "Container port should be accepted"
  }

  assert {
    condition     = var.health_check_path == "/api/health"
    error_message = "Health check path should be accepted"
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

# ============================================
# Test: Fargate Spot
# ============================================

run "fargate_spot_enabled" {
  command = plan

  variables {
    project         = "test-api"
    environment     = "dev"
    aws_region      = "us-east-1"
    use_fargate_spot = true
  }

  assert {
    condition     = var.use_fargate_spot == true
    error_message = "Fargate Spot should be accepted"
  }
}
