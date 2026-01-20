# environments/dev/terraform.tfvars
# Development environment configuration

# Project Configuration
project     = "rest-api"
environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
az_count = 2

# RDS Configuration (minimal for dev)
db_name                         = "app"
db_username                     = "postgres"
db_instance_class               = "db.t3.micro"
db_allocated_storage            = 20
db_max_allocated_storage        = 100
db_multi_az                     = false
db_backup_retention_period      = 7
db_performance_insights_enabled = false
db_deletion_protection          = false
db_skip_final_snapshot          = true

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout     = 30
cors_allow_origins = ["*"]

# Observability
log_retention_days = 14
