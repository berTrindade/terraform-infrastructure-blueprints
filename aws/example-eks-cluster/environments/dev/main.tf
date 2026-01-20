# environments/dev/main.tf

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

module "vpc" {
  source              = "../../modules/vpc"
  vpc_name            = module.naming.vpc
  vpc_cidr            = var.vpc_cidr
  az_count            = var.az_count
  public_subnet_name  = module.naming.public_subnet
  private_subnet_name = module.naming.private_subnet
  cluster_name        = module.naming.cluster
  single_nat_gateway  = var.single_nat_gateway
  tags                = module.tagging.tags
}

module "cluster" {
  source                  = "../../modules/cluster"
  cluster_name            = module.naming.cluster
  cluster_version         = var.cluster_version
  cluster_role_name       = module.naming.cluster_role
  vpc_id                  = module.vpc.vpc_id
  vpc_cidr                = module.vpc.vpc_cidr
  subnet_ids              = module.vpc.private_subnet_ids
  endpoint_private_access = var.endpoint_private_access
  endpoint_public_access  = var.endpoint_public_access
  public_access_cidrs     = var.public_access_cidrs
  enabled_log_types       = var.enabled_log_types
  tags                    = module.tagging.tags
}

module "nodes" {
  source          = "../../modules/nodes"
  cluster_name    = module.cluster.cluster_name
  node_group_name = module.naming.node_group
  node_role_name  = module.naming.node_role
  subnet_ids      = module.vpc.private_subnet_ids
  instance_types  = var.node_instance_types
  capacity_type   = var.node_capacity_type
  disk_size       = var.node_disk_size
  desired_size    = var.node_desired_size
  min_size        = var.node_min_size
  max_size        = var.node_max_size
  labels          = var.node_labels
  taints          = var.node_taints
  tags            = module.tagging.tags
}

module "addons" {
  source                      = "../../modules/addons"
  cluster_name                = module.cluster.cluster_name
  vpc_id                      = module.vpc.vpc_id
  oidc_provider_arn           = module.cluster.oidc_provider_arn
  oidc_issuer                 = module.cluster.oidc_issuer
  ebs_csi_role_name           = module.naming.ebs_csi_role
  lb_controller_role_name     = module.naming.lb_controller_role
  enable_lb_controller        = var.enable_lb_controller
  lb_controller_chart_version = var.lb_controller_chart_version
  tags                        = module.tagging.tags

  depends_on = [module.nodes]
}
