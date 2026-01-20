# modules/naming/main.tf
# Naming convention for EKS cluster with ArgoCD

locals {
  prefix = "${var.project}-${var.environment}"

  names = {
    # VPC
    vpc            = "${local.prefix}-vpc"
    public_subnet  = "${local.prefix}-public"
    private_subnet = "${local.prefix}-private"
    security_group = "${local.prefix}-sg"

    # EKS
    cluster        = "${local.prefix}-eks"
    node_group     = "${local.prefix}-nodes"
    node_role      = "${local.prefix}-node-role"
    cluster_role   = "${local.prefix}-cluster-role"

    # Addons
    lb_controller_role      = "${local.prefix}-lb-controller"
    ebs_csi_role            = "${local.prefix}-ebs-csi"
    cluster_autoscaler_role = "${local.prefix}-autoscaler"

    # ArgoCD
    argocd_namespace = "argocd"
  }
}
