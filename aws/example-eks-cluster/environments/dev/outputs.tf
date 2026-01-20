# environments/dev/outputs.tf

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.cluster.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.cluster.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded CA certificate"
  value       = module.cluster.cluster_certificate_authority_data
  sensitive   = true
}

output "cluster_version" {
  description = "EKS cluster version"
  value       = module.cluster.cluster_version
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.cluster.cluster_arn
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.cluster.oidc_provider_arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "node_group_arn" {
  description = "Node group ARN"
  value       = module.nodes.node_group_arn
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.cluster.cluster_name}"
}
