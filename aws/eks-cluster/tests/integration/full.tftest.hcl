# tests/integration/full.tftest.hcl
# Integration tests for full deployment
# Based on Terraform native testing framework (1.6+)
#
# WARNING: These tests create real AWS resources!
# Run with: terraform test -filter=tests/integration/full.tftest.hcl
# Requires AWS credentials with appropriate permissions.
#
# NOTE: EKS cluster creation takes ~15-20 minutes

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
    project     = "test-eks"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    node_instance_types = ["t3.medium"]
    node_desired_size   = 1
    node_min_size       = 1
    node_max_size       = 2
    node_disk_size      = 20

    # VPC settings (cost optimization)
    single_nat_gateway = true
    az_count           = 2

    # Cluster settings
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]

    # Addons
    enable_lb_controller = false
  }

  # Verify EKS cluster created
  assert {
    condition     = output.cluster_name != ""
    error_message = "EKS cluster should be created"
  }

  # Verify cluster endpoint created
  assert {
    condition     = output.cluster_endpoint != ""
    error_message = "Cluster endpoint should be created"
  }

  # Verify cluster version
  assert {
    condition     = output.cluster_version == "1.29"
    error_message = "Cluster version should be 1.29"
  }

  # Verify OIDC provider created
  assert {
    condition     = output.oidc_provider_arn != ""
    error_message = "OIDC provider should be created"
  }

  # Verify VPC created
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC should be created"
  }

  # Verify node group created
  assert {
    condition     = output.node_group_arn != ""
    error_message = "Node group should be created"
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

    node_instance_types = ["t3.medium"]
    node_desired_size   = 1
    node_min_size       = 1
    node_max_size       = 2
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]
    enable_lb_controller    = false
  }

  # Verify cluster naming
  assert {
    condition     = output.cluster_name == "myproject-dev-eks"
    error_message = "EKS cluster should follow naming convention"
  }
}

# ============================================
# Test: Cluster endpoint format
# ============================================

run "cluster_endpoint_format" {
  command = apply

  variables {
    project     = "test-ep"
    environment = "dev"
    aws_region  = "us-east-1"

    node_instance_types = ["t3.medium"]
    node_desired_size   = 1
    node_min_size       = 1
    node_max_size       = 2
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]
    enable_lb_controller    = false
  }

  # Verify cluster endpoint format
  assert {
    condition     = can(regex("^https://", output.cluster_endpoint))
    error_message = "Cluster endpoint should be HTTPS"
  }

  # Verify cluster endpoint contains EKS
  assert {
    condition     = can(regex("\\.eks\\.amazonaws\\.com", output.cluster_endpoint))
    error_message = "Cluster endpoint should be in EKS domain"
  }
}

# ============================================
# Test: OIDC provider ARN format
# ============================================

run "oidc_provider" {
  command = apply

  variables {
    project     = "test-oidc"
    environment = "dev"
    aws_region  = "us-east-1"

    node_instance_types = ["t3.medium"]
    node_desired_size   = 1
    node_min_size       = 1
    node_max_size       = 2
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]
    enable_lb_controller    = false
  }

  # Verify OIDC provider ARN format
  assert {
    condition     = can(regex("^arn:aws:iam::", output.oidc_provider_arn))
    error_message = "OIDC provider ARN should have correct format"
  }
}
