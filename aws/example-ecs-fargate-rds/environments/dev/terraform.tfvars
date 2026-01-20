# environments/dev/terraform.tfvars

project     = "fargate-rds"
environment = "dev"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
az_count           = 2
single_nat_gateway = true

# Database
db_engine_version              = "16.3"
db_instance_class              = "db.t3.micro"
db_allocated_storage           = 20
db_name                        = "app"
db_multi_az                    = false
db_skip_final_snapshot         = true
db_deletion_protection         = false
db_backup_retention_period     = 7
db_enable_performance_insights = false

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
