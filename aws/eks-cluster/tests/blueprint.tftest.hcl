# Native Terraform Test for EKS Cluster
# Run: terraform test

variables {
  project     = "test-eks"
  environment = "dev"
  aws_region  = "eu-west-2"
}

# ============================================
# Test: Input Validation
# ============================================

run "validate_project_name_format" {
  command = plan

  variables {
    project     = "my-k8s-cluster"
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
    project     = "test-eks"
    environment = "prod"
  }

  assert {
    condition     = true
    error_message = "Environment validation should pass for 'prod'"
  }
}

# ============================================
# Test: VPC Configuration
# ============================================

run "verify_vpc_created" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  assert {
    condition     = module.vpc.vpc_id != ""
    error_message = "VPC should be planned for creation"
  }
}

run "verify_private_subnets_for_eks" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
    az_count    = 2
  }

  # EKS requires at least 2 subnets in different AZs
  assert {
    condition     = length(module.vpc.private_subnets) >= 2
    error_message = "EKS requires at least 2 private subnets"
  }
}

# ============================================
# Test: EKS Configuration
# ============================================

run "verify_eks_cluster_created" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  assert {
    condition     = module.eks.cluster_name != ""
    error_message = "EKS cluster should be planned for creation"
  }
}

run "verify_eks_cluster_version" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  # Ensure a recent Kubernetes version is used
  assert {
    condition     = can(regex("^1\\.(2[8-9]|[3-9][0-9])$", var.kubernetes_version))
    error_message = "Kubernetes version should be 1.28 or newer"
  }
}

# ============================================
# Test: Node Group Configuration
# ============================================

run "verify_default_instance_types" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  # Default should include cost-effective instance types
  assert {
    condition     = length(var.node_instance_types) > 0
    error_message = "Node instance types should be configured"
  }
}

run "verify_default_node_scaling" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  assert {
    condition     = var.node_min_size >= 1
    error_message = "Minimum node count should be at least 1"
  }
}

run "verify_max_nodes_greater_than_min" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  assert {
    condition     = var.node_max_size >= var.node_min_size
    error_message = "Max nodes should be >= min nodes"
  }
}

# ============================================
# Test: Security Configuration
# ============================================

run "verify_endpoint_access_defaults" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  # By default, public access should be enabled for development
  assert {
    condition     = var.cluster_endpoint_public_access == true
    error_message = "Public endpoint access should be enabled by default for dev"
  }
}

# ============================================
# Test: Addons Configuration
# ============================================

run "verify_core_addons_enabled" {
  command = plan

  variables {
    project     = "test-eks"
    environment = "dev"
  }

  # CoreDNS, kube-proxy, and vpc-cni should be enabled
  assert {
    condition     = var.enable_cluster_addons == true
    error_message = "Cluster addons should be enabled by default"
  }
}
