# environments/dev/outputs.tf
# Outputs using official module references

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${module.alb.dns_name}"
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.alb.dns_name
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = module.alb.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.this.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.this.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = module.ecs.cluster_arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.ecs.services["api"].name
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = module.data.db_instance_endpoint
}

output "db_name" {
  description = "Database name"
  value       = module.data.db_name
}

output "db_secret_arn" {
  description = "ARN of the database metadata secret (connection info only, no password)"
  value       = module.secrets.secret_arn
}

output "db_secret_name" {
  description = "Name of the database metadata secret"
  value       = module.secrets.secret_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "IDs of database subnets"
  value       = module.vpc.database_subnets
}
