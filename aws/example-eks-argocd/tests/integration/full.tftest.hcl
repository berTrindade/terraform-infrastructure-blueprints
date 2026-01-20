# tests/integration/full.tftest.hcl
# Integration tests for full deployment
# Based on Terraform native testing framework (1.6+)
#
# WARNING: These tests create real AWS resources!
# Run with: terraform test -filter=tests/integration/full.tftest.hcl
# Requires AWS credentials with appropriate permissions.
#
# NOTE: EKS + ArgoCD deployment takes ~20-25 minutes

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
    project     = "test-argocd"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    node_instance_types = ["t3.medium"]
    node_desired_size   = 2
    node_min_size       = 1
    node_max_size       = 3
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
    enable_lb_controller = true

    # ArgoCD settings
    argocd_ha_enabled     = false
    argocd_set_resources  = true
    argocd_enable_ingress = false
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

  # Verify ArgoCD namespace created
  assert {
    condition     = output.argocd_namespace == "argocd"
    error_message = "ArgoCD namespace should be created"
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
    node_desired_size   = 2
    node_min_size       = 1
    node_max_size       = 3
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]

    enable_lb_controller  = true
    argocd_ha_enabled     = false
    argocd_set_resources  = true
    argocd_enable_ingress = false
  }

  # Verify cluster naming
  assert {
    condition     = output.cluster_name == "myproject-dev-eks"
    error_message = "EKS cluster should follow naming convention"
  }

  # Verify ArgoCD namespace
  assert {
    condition     = output.argocd_namespace == "argocd"
    error_message = "ArgoCD namespace should be 'argocd'"
  }
}

# ============================================
# Test: ArgoCD with ingress
# ============================================

run "argocd_with_ingress" {
  command = apply

  variables {
    project     = "test-ing"
    environment = "dev"
    aws_region  = "us-east-1"

    node_instance_types = ["t3.medium"]
    node_desired_size   = 2
    node_min_size       = 1
    node_max_size       = 3
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]

    enable_lb_controller  = true
    argocd_ha_enabled     = false
    argocd_set_resources  = true
    argocd_enable_ingress = true
    argocd_ingress_scheme = "internet-facing"
  }

  # Verify ArgoCD URL created
  assert {
    condition     = output.argocd_url != null && output.argocd_url != ""
    error_message = "ArgoCD URL should be created when ingress is enabled"
  }

  # Verify ArgoCD URL format
  assert {
    condition     = can(regex("^http://", output.argocd_url))
    error_message = "ArgoCD URL should be HTTP (ALB)"
  }
}

# ============================================
# Test: kubectl configuration command
# ============================================

run "kubectl_config" {
  command = apply

  variables {
    project     = "test-kube"
    environment = "dev"
    aws_region  = "us-east-1"

    node_instance_types = ["t3.medium"]
    node_desired_size   = 2
    node_min_size       = 1
    node_max_size       = 3
    node_disk_size      = 20

    single_nat_gateway      = true
    az_count                = 2
    cluster_version         = "1.29"
    endpoint_private_access = true
    endpoint_public_access  = true
    enabled_log_types       = ["api"]

    enable_lb_controller  = true
    argocd_ha_enabled     = false
    argocd_set_resources  = true
    argocd_enable_ingress = false
  }

  # Verify kubectl config command contains cluster name
  assert {
    condition     = can(regex("test-kube-dev-eks", output.configure_kubectl))
    error_message = "kubectl config command should contain cluster name"
  }

  # Verify ArgoCD password command exists
  assert {
    condition     = can(regex("argocd-initial-admin-secret", output.argocd_get_admin_password))
    error_message = "ArgoCD password command should reference admin secret"
  }
}
