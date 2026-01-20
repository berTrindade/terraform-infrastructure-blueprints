# environments/dev/terraform.tfvars
# Development environment configuration

# Project Configuration
project     = "rest-api"
environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
az_count = 2

# Aurora Serverless v2 Configuration
db_name                         = "app"
db_username                     = "postgres"
aurora_engine_version           = "15.4"
aurora_instance_count           = 1
aurora_min_capacity             = 0.5  # Minimum ACUs (scales to 0 cost when idle)
aurora_max_capacity             = 4    # Maximum ACUs for dev
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
