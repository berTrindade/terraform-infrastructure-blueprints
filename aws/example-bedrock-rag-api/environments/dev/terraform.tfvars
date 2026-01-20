# environments/dev/terraform.tfvars

project     = "rag-api"
environment = "dev"
aws_region  = "us-east-1"

# S3
s3_version_retention_days = 30
cors_allow_origins        = ["*"]

# OpenSearch Serverless
# DISABLED reduces cost but removes HA
opensearch_standby_replicas = "DISABLED"

# Knowledge Base
vector_index_name        = "bedrock-knowledge-base-default-index"
embedding_model_id       = "amazon.titan-embed-text-v2:0"
generation_model_id      = "anthropic.claude-3-sonnet-20240229-v1:0"
chunk_max_tokens         = 300
chunk_overlap_percentage = 20

# Lambda
lambda_memory_size = 512
lambda_timeout     = 60

# Observability
log_retention_days = 14
