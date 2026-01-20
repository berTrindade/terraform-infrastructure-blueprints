# environments/dev/outputs.tf

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = module.service.alb_url
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.service.alb_dns_name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.service.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.cluster.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = module.service.service_name
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = module.service.log_group_name
}
