# environments/dev/terraform.tfvars

project     = "fargate-api"
environment = "dev"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
az_count           = 2
single_nat_gateway = true

# ECS
enable_container_insights = true
use_fargate_spot          = false
task_cpu                  = 256
task_memory               = 512
desired_count             = 1
container_port            = 3000
health_check_path         = "/health"

# Observability
log_retention_days = 14
