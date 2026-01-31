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
    project     = "test-ecs-rds"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    task_cpu      = 256
    task_memory   = 512
    desired_count = 1

    # RDS settings
    db_instance_class              = "db.t3.micro"
    db_allocated_storage           = 20
    db_multi_az                    = false
    db_enable_performance_insights = false
    db_deletion_protection         = false
    db_skip_final_snapshot         = true
    db_backup_retention_period     = 1

    # Cluster settings
    enable_container_insights = false
    use_fargate_spot          = false

    # VPC settings
    single_nat_gateway = true

    # Short retention for cleanup
    log_retention_days = 1
  }

  # Verify ALB created
  assert {
    condition     = output.alb_url != ""
    error_message = "ALB URL should be created"
  }

  # Verify ALB DNS name
  assert {
    condition     = output.alb_dns_name != ""
    error_message = "ALB DNS name should be created"
  }

  # Verify ECS cluster created
  assert {
    condition     = output.ecs_cluster_name != ""
    error_message = "ECS cluster should be created"
  }

  # Verify ECS service created
  assert {
    condition     = output.ecs_service_name != ""
    error_message = "ECS service should be created"
  }

  # Verify ECR repository created
  assert {
    condition     = output.ecr_repository_url != ""
    error_message = "ECR repository should be created"
  }

  # Verify RDS created
  assert {
    condition     = output.db_endpoint != ""
    error_message = "RDS endpoint should be created"
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

    task_cpu      = 256
    task_memory   = 512
    desired_count = 1

    db_instance_class              = "db.t3.micro"
    db_allocated_storage           = 20
    db_multi_az                    = false
    db_enable_performance_insights = false
    db_deletion_protection         = false
    db_skip_final_snapshot         = true
    db_backup_retention_period     = 1

    enable_container_insights = false
    use_fargate_spot          = false
    single_nat_gateway        = true
    log_retention_days        = 1
  }

  # Verify ECS cluster naming
  assert {
    condition     = output.ecs_cluster_name == "myproject-dev-cluster"
    error_message = "ECS cluster should follow naming convention"
  }

  # Verify ECS service naming
  assert {
    condition     = output.ecs_service_name == "myproject-dev-api"
    error_message = "ECS service should follow naming convention"
  }

  # Verify database name
  assert {
    condition     = output.db_name == "app"
    error_message = "Database name should be 'app'"
  }
}

# ============================================
# Test: Database endpoint format
# ============================================

run "database_endpoint" {
  command = apply

  variables {
    project     = "test-db"
    environment = "dev"
    aws_region  = "us-east-1"

    task_cpu      = 256
    task_memory   = 512
    desired_count = 1

    db_instance_class              = "db.t3.micro"
    db_allocated_storage           = 20
    db_multi_az                    = false
    db_enable_performance_insights = false
    db_deletion_protection         = false
    db_skip_final_snapshot         = true
    db_backup_retention_period     = 1

    enable_container_insights = false
    use_fargate_spot          = false
    single_nat_gateway        = true
    log_retention_days        = 1
  }

  # Verify RDS endpoint format
  assert {
    condition     = can(regex("\\.rds\\.amazonaws\\.com:", output.db_endpoint))
    error_message = "RDS endpoint should have correct format"
  }
}
