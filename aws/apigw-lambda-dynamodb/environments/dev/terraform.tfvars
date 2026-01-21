# environments/dev/terraform.tfvars

project     = "items-api"
environment = "dev"
aws_region  = "eu-west-2"

# DynamoDB
dynamodb_billing_mode = "PAY_PER_REQUEST"
enable_dynamodb_pitr  = true

# Lambda
lambda_memory_size = 256
lambda_timeout     = 30
cors_allow_origins = ["*"]

# Observability
log_retention_days = 14
