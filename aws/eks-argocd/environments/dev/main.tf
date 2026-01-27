# environments/dev/main.tf
# Uses official terraform-aws-modules and AWS EKS Blueprints Addons

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

module "tagging" {
  source          = "../../modules/tagging"
  project         = var.project
  environment     = var.environment
  repository      = var.repository
  additional_tags = var.additional_tags
}

# ============================================
# VPC (Official Module)
# ============================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 4, i + var.az_count)]
  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 4, i)]

  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  # EKS-specific tags for AWS Load Balancer Controller
  public_subnet_tags = {
    "kubernetes.io/role/elb"                         = 1
    "kubernetes.io/cluster/${module.naming.cluster}" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"                = 1
    "kubernetes.io/cluster/${module.naming.cluster}" = "shared"
  }

  # VPC Flow Logs - Created separately below to use custom IAM role

  tags = module.tagging.tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${module.naming.vpc}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = module.tagging.tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${module.naming.vpc}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/vpc/${module.naming.vpc}/flow-logs*"
    }]
  })
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/${module.naming.vpc}/flow-logs"
  retention_in_days = 7

  tags = module.tagging.tags
}

# VPC Flow Log
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = module.vpc.vpc_id

  tags = module.tagging.tags
}

# ============================================
# EKS Cluster (Official Module)
# ============================================

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = module.naming.cluster
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Cluster endpoint access
  cluster_endpoint_private_access      = var.endpoint_private_access
  cluster_endpoint_public_access       = var.endpoint_public_access
  cluster_endpoint_public_access_cidrs = var.public_access_cidrs

  # Cluster logging
  cluster_enabled_log_types = var.enabled_log_types

  # Managed Node Groups
  eks_managed_node_groups = {
    default = {
      name           = module.naming.node_group
      instance_types = var.node_instance_types
      capacity_type  = var.node_capacity_type
      disk_size      = var.node_disk_size

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      labels = var.node_labels
      taints = [for t in var.node_taints : {
        key    = t.key
        value  = t.value
        effect = t.effect
      }]

      # Enable SSM for node access
      iam_role_additional_policies = {
        AmazonSSMManagedInstanceCore = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      }
    }
  }

  # Allow access from the cluster to the node groups
  node_security_group_additional_rules = {
    ingress_allow_access_from_control_plane = {
      type                          = "ingress"
      protocol                      = "tcp"
      from_port                     = 9443
      to_port                       = 9443
      source_cluster_security_group = true
      description                   = "Allow access from control plane to webhook port of AWS LB controller"
    }
  }

  tags = module.tagging.tags
}

# ============================================
# CloudWatch Container Insights
# ============================================

resource "aws_cloudwatch_log_group" "container_insights" {
  name              = "/aws/containerinsights/${module.eks.cluster_name}/performance"
  retention_in_days = 7

  tags = module.tagging.tags
}

# Enable Container Insights
# Note: Container Insights requires manual setup via kubectl after cluster creation:
# kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
# Or use AWS Console: EKS > Cluster > Observability > Add-ons > CloudWatch Observability

# ============================================
# EKS Blueprints Addons (Official AWS Module)
# Includes: ArgoCD, AWS LB Controller, EBS CSI, and more
# ============================================

module "eks_blueprints_addons" {
  source  = "aws-ia/eks-blueprints-addons/aws"
  version = "~> 1.0"

  cluster_name      = module.eks.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = module.eks.cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  # ============================================
  # Core EKS Addons
  # ============================================
  eks_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # ============================================
  # AWS Load Balancer Controller
  # ============================================
  enable_aws_load_balancer_controller = var.enable_lb_controller
  aws_load_balancer_controller = {
    chart_version = var.lb_controller_chart_version
  }

  # ============================================
  # ArgoCD (Official Helm Chart)
  # ============================================
  enable_argocd = true
  argocd = {
    name          = "argocd"
    chart_version = var.argocd_chart_version
    namespace     = module.naming.argocd_namespace
    values = concat(
      var.argocd_values,
      var.argocd_ha_enabled ? [yamlencode({
        controller = {
          replicas = 2
        }
        server = {
          replicas = 2
        }
        repoServer = {
          replicas = 2
        }
        applicationSet = {
          replicas = 2
        }
      })] : []
      # Note: Gateway API resources are created via Terraform, not Helm ingress
    )
  }

  tags = module.tagging.tags

  depends_on = [module.eks]
}
