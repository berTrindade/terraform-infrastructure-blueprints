# environments/dev/outputs.tf

output "alb_url" {
  value = module.service.alb_url
}

output "alb_dns_name" {
  value = module.service.alb_dns_name
}

output "ecr_repository_url" {
  value = module.service.ecr_repository_url
}

output "ecs_cluster_name" {
  value = module.cluster.cluster_name
}

output "ecs_service_name" {
  value = module.service.service_name
}

output "db_endpoint" {
  value = module.data.db_instance_endpoint
}

output "db_name" {
  value = module.data.db_name
}

output "log_group_name" {
  value = module.service.log_group_name
}
