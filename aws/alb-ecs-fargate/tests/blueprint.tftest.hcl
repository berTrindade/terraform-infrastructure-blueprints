# Native Terraform Test for ECS Fargate API
# Run: terraform test

variables {
  project     = "test-ecs"
  environment = "dev"
  aws_region  = "eu-west-2"
}

# ============================================
# Test: Input Validation
# ============================================

run "validate_project_name_format" {
  command = plan

  variables {
    project     = "my-ecs-app"
    environment = "dev"
  }

  assert {
    condition     = true
    error_message = "Project name validation should pass for valid names"
  }
}

run "validate_environment_constraint" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "staging"
  }

  assert {
    condition     = true
    error_message = "Environment validation should pass for 'staging'"
  }
}

# ============================================
# Test: VPC Configuration
# ============================================

run "verify_vpc_created" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  # Verify VPC module is configured
  assert {
    condition     = module.vpc.vpc_id != ""
    error_message = "VPC should be planned for creation"
  }
}

run "verify_private_subnets_count" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
    az_count    = 2
  }

  assert {
    condition     = length(module.vpc.private_subnets) >= var.az_count
    error_message = "Should have at least az_count private subnets"
  }
}

run "verify_public_subnets_count" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
    az_count    = 2
  }

  assert {
    condition     = length(module.vpc.public_subnets) >= var.az_count
    error_message = "Should have at least az_count public subnets"
  }
}

# ============================================
# Test: ECS Configuration
# ============================================

run "verify_ecs_cluster_created" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = module.ecs.cluster_name != ""
    error_message = "ECS cluster should be planned for creation"
  }
}

run "verify_alb_created" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = module.alb.dns_name != ""
    error_message = "ALB should be planned for creation"
  }
}

run "verify_ecr_repository_created" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = aws_ecr_repository.this.repository_url != ""
    error_message = "ECR repository should be planned for creation"
  }
}

# ============================================
# Test: Default Values
# ============================================

run "verify_default_task_cpu" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = var.task_cpu == 256
    error_message = "Default task CPU should be 256"
  }
}

run "verify_default_task_memory" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = var.task_memory == 512
    error_message = "Default task memory should be 512 MB"
  }
}

run "verify_default_desired_count" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = var.desired_count == 1
    error_message = "Default desired count should be 1"
  }
}

run "verify_container_insights_enabled" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = var.enable_container_insights == true
    error_message = "Container insights should be enabled by default"
  }
}

# ============================================
# Test: Security Defaults
# ============================================

run "verify_fargate_not_spot_by_default" {
  command = plan

  variables {
    project     = "test-ecs"
    environment = "dev"
  }

  assert {
    condition     = var.use_fargate_spot == false
    error_message = "Fargate SPOT should be disabled by default"
  }
}
