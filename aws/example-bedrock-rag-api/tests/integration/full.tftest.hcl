# tests/integration/full.tftest.hcl
# Integration tests for full deployment
# Based on Terraform native testing framework (1.6+)
#
# WARNING: These tests create real AWS resources!
# Run with: terraform test -filter=tests/integration/full.tftest.hcl
# Requires AWS credentials with appropriate permissions.
#
# NOTE: This deployment requires Bedrock model access to be enabled
# in your AWS account for the specified region.

# ============================================
# Provider configuration
# ============================================

provider "aws" {
  region = "us-east-1"
}

# ============================================
# Test: Full deployment with default values
# ============================================

run "full_deployment" {
  command = apply

  variables {
    project     = "test-rag-api"
    environment = "dev"
    aws_region  = "us-east-1"

    # Use minimal resources for testing
    lambda_memory_size = 512
    lambda_timeout     = 60

    # Knowledge Base settings
    chunk_max_tokens         = 300
    chunk_overlap_percentage = 20

    # OpenSearch settings (cost optimization)
    opensearch_standby_replicas = "DISABLED"

    # Short retention for cleanup
    log_retention_days        = 1
    s3_version_retention_days = 1
  }

  # Verify API Gateway created
  assert {
    condition     = output.api_endpoint != ""
    error_message = "API endpoint should be created"
  }

  # Verify query endpoint created
  assert {
    condition     = output.query_endpoint != ""
    error_message = "Query endpoint should be created"
  }

  # Verify ingest endpoint created
  assert {
    condition     = output.ingest_endpoint != ""
    error_message = "Ingest endpoint should be created"
  }

  # Verify Knowledge Base created
  assert {
    condition     = output.knowledge_base_id != ""
    error_message = "Knowledge Base should be created"
  }

  # Verify Data Source created
  assert {
    condition     = output.data_source_id != ""
    error_message = "Data Source should be created"
  }

  # Verify S3 bucket created
  assert {
    condition     = output.documents_bucket != ""
    error_message = "Documents bucket should be created"
  }

  # Verify OpenSearch collection created
  assert {
    condition     = output.opensearch_collection_endpoint != ""
    error_message = "OpenSearch collection should be created"
  }

  # Verify Lambda function created
  assert {
    condition     = output.lambda_function_name != ""
    error_message = "Lambda function should be created"
  }
}

# ============================================
# Test: Naming convention
# ============================================

run "naming_convention" {
  command = apply

  variables {
    project     = "myproject"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size          = 512
    lambda_timeout              = 60
    chunk_max_tokens            = 300
    chunk_overlap_percentage    = 20
    opensearch_standby_replicas = "DISABLED"
    log_retention_days          = 1
    s3_version_retention_days   = 1
  }

  # Verify Lambda naming
  assert {
    condition     = output.lambda_function_name == "myproject-dev-rag-api"
    error_message = "Lambda function should follow naming convention"
  }

  # Verify bucket naming contains project
  assert {
    condition     = can(regex("myproject-dev", output.documents_bucket))
    error_message = "Documents bucket should follow naming convention"
  }
}

# ============================================
# Test: API endpoint format
# ============================================

run "api_endpoint_format" {
  command = apply

  variables {
    project     = "test-ep"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size          = 512
    lambda_timeout              = 60
    chunk_max_tokens            = 300
    chunk_overlap_percentage    = 20
    opensearch_standby_replicas = "DISABLED"
    log_retention_days          = 1
    s3_version_retention_days   = 1
  }

  # Verify API endpoint format
  assert {
    condition     = can(regex("^https://", output.api_endpoint))
    error_message = "API endpoint should be HTTPS"
  }

  # Verify query endpoint
  assert {
    condition     = can(regex("/query$", output.query_endpoint))
    error_message = "Query endpoint should end with /query"
  }

  # Verify ingest endpoint
  assert {
    condition     = can(regex("/ingest$", output.ingest_endpoint))
    error_message = "Ingest endpoint should end with /ingest"
  }
}

# ============================================
# Test: OpenSearch endpoint format
# ============================================

run "opensearch_endpoint" {
  command = apply

  variables {
    project     = "test-os"
    environment = "dev"
    aws_region  = "us-east-1"

    lambda_memory_size          = 512
    lambda_timeout              = 60
    chunk_max_tokens            = 300
    chunk_overlap_percentage    = 20
    opensearch_standby_replicas = "DISABLED"
    log_retention_days          = 1
    s3_version_retention_days   = 1
  }

  # Verify OpenSearch endpoint format
  assert {
    condition     = can(regex("\\.aoss\\.amazonaws\\.com", output.opensearch_collection_endpoint))
    error_message = "OpenSearch endpoint should be in AOSS domain"
  }
}
