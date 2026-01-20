# environments/dev/terraform.tfvars

project     = "secure-api"
environment = "dev"
aws_region  = "us-east-1"

# Cognito
password_minimum_length  = 8
password_require_symbols = false
mfa_configuration        = "OFF"
access_token_validity    = 1
id_token_validity        = 1
refresh_token_validity   = 30

# DynamoDB
dynamodb_billing_mode = "PAY_PER_REQUEST"
enable_dynamodb_pitr  = true

# Lambda
lambda_memory_size = 256
lambda_timeout     = 30
cors_allow_origins = ["*"]
log_retention_days = 14
