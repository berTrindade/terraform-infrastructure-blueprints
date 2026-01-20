# tests/unit/validation.tftest.hcl
# Unit tests for input validation
# Based on Terraform native testing framework (1.6+)
#
# Run with: terraform test -filter=tests/unit/

# ============================================
# Mock providers (no AWS calls)
# ============================================

mock_provider "aws" {}
mock_provider "tls" {}
mock_provider "helm" {}
mock_provider "kubernetes" {}

# ============================================
# Test: Valid project name
# ============================================

run "valid_project_name" {
  command = plan

  variables {
    project     = "my-eks"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.project == "my-eks"
    error_message = "Project name should be accepted"
  }
}

# ============================================
# Test: Invalid project name (uppercase)
# ============================================

run "invalid_project_name_uppercase" {
  command = plan

  variables {
    project     = "MyEKS"
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
    project     = "123eks"
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
    project     = "test-eks"
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
    project     = "test-eks"
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
    project     = "test-eks"
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
    project     = "test-eks"
    environment = "production"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.environment]
}

# ============================================
# Test: EKS cluster configuration
# ============================================

run "valid_cluster_config" {
  command = plan

  variables {
    project                 = "test-eks"
    environment             = "dev"
    aws_region              = "us-east-1"
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  assert {
    condition     = var.cluster_version == "1.29"
    error_message = "Cluster version should be accepted"
  }

  assert {
    condition     = var.endpoint_private_access == true
    error_message = "Private access should be accepted"
  }
}

run "cluster_public_access_cidrs" {
  command = plan

  variables {
    project             = "test-eks"
    environment         = "dev"
    aws_region          = "us-east-1"
    public_access_cidrs = ["10.0.0.0/8", "192.168.0.0/16"]
  }

  assert {
    condition     = length(var.public_access_cidrs) == 2
    error_message = "Multiple public access CIDRs should be accepted"
  }
}

# ============================================
# Test: Node group configuration
# ============================================

run "valid_node_config" {
  command = plan

  variables {
    project             = "test-eks"
    environment         = "dev"
    aws_region          = "us-east-1"
    node_instance_types = ["t3.large", "t3.xlarge"]
    node_capacity_type  = "ON_DEMAND"
    node_disk_size      = 100
    node_desired_size   = 3
    node_min_size       = 2
    node_max_size       = 10
  }

  assert {
    condition     = length(var.node_instance_types) == 2
    error_message = "Multiple instance types should be accepted"
  }

  assert {
    condition     = var.node_disk_size == 100
    error_message = "Node disk size should be accepted"
  }

  assert {
    condition     = var.node_desired_size == 3
    error_message = "Node desired size should be accepted"
  }
}

run "node_spot_instances" {
  command = plan

  variables {
    project            = "test-eks"
    environment        = "dev"
    aws_region         = "us-east-1"
    node_capacity_type = "SPOT"
  }

  assert {
    condition     = var.node_capacity_type == "SPOT"
    error_message = "SPOT capacity type should be accepted"
  }
}

run "node_labels_and_taints" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
    aws_region  = "us-east-1"
    node_labels = {
      "role" = "worker"
      "env"  = "dev"
    }
    node_taints = [{
      key    = "dedicated"
      value  = "special"
      effect = "NO_SCHEDULE"
    }]
  }

  assert {
    condition     = length(var.node_labels) == 2
    error_message = "Node labels should be accepted"
  }

  assert {
    condition     = length(var.node_taints) == 1
    error_message = "Node taints should be accepted"
  }
}

# ============================================
# Test: VPC configuration
# ============================================

run "valid_vpc_config" {
  command = plan

  variables {
    project     = "test-eks"
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
# Test: Addons configuration
# ============================================

run "addons_config" {
  command = plan

  variables {
    project                     = "test-eks"
    environment                 = "dev"
    aws_region                  = "us-east-1"
    enable_lb_controller        = true
    lb_controller_chart_version = "1.7.1"
  }

  assert {
    condition     = var.enable_lb_controller == true
    error_message = "LB controller should be accepted"
  }

  assert {
    condition     = var.lb_controller_chart_version == "1.7.1"
    error_message = "LB controller version should be accepted"
  }
}
