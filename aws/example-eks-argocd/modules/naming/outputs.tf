# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "vpc" {
  value = local.names.vpc
}

output "public_subnet" {
  value = local.names.public_subnet
}

output "private_subnet" {
  value = local.names.private_subnet
}

output "security_group" {
  value = local.names.security_group
}

output "cluster" {
  value = local.names.cluster
}

output "node_group" {
  value = local.names.node_group
}

output "node_role" {
  value = local.names.node_role
}

output "cluster_role" {
  value = local.names.cluster_role
}

output "lb_controller_role" {
  value = local.names.lb_controller_role
}

output "ebs_csi_role" {
  value = local.names.ebs_csi_role
}

output "cluster_autoscaler_role" {
  value = local.names.cluster_autoscaler_role
}

output "argocd_namespace" {
  value = local.names.argocd_namespace
}
