# tests/unit/validation.tftest.hcl
# Unit tests for input validation
# Based on Terraform native testing framework (1.6+)
#
# Run with: terraform test -filter=tests/unit/

# ============================================
# Mock providers (no AWS calls)
# ============================================

mock_provider "aws" {}
mock_provider "archive" {}
mock_provider "time" {}

# ============================================
# Test: Valid project name
# ============================================

run "valid_project_name" {
  command = plan

  variables {
    project     = "my-rag"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.project == "my-rag"
    error_message = "Project name should be accepted"
  }
}

# ============================================
# Test: Invalid project name (uppercase)
# ============================================

run "invalid_project_name_uppercase" {
  command = plan

  variables {
    project     = "MyRAG"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.project]
}

# ============================================
# Test: Invalid project name (starts with number)
# ============================================

run "invalid_project_name_starts_with_number" {
  command = plan

  variables {
    project     = "123rag"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.project]
}

# ============================================
# Test: Valid environment values
# ============================================

run "valid_environment_dev" {
  command = plan

  variables {
    project     = "test-rag"
    environment = "dev"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "dev"
    error_message = "Environment 'dev' should be accepted"
  }
}

run "valid_environment_staging" {
  command = plan

  variables {
    project     = "test-rag"
    environment = "staging"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "staging"
    error_message = "Environment 'staging' should be accepted"
  }
}

run "valid_environment_prod" {
  command = plan

  variables {
    project     = "test-rag"
    environment = "prod"
    aws_region  = "us-east-1"
  }

  assert {
    condition     = var.environment == "prod"
    error_message = "Environment 'prod' should be accepted"
  }
}

# ============================================
# Test: Invalid environment value
# ============================================

run "invalid_environment" {
  command = plan

  variables {
    project     = "test-rag"
    environment = "production"
    aws_region  = "us-east-1"
  }

  expect_failures = [var.environment]
}

# ============================================
# Test: Lambda configuration
# ============================================

run "valid_lambda_config" {
  command = plan

  variables {
    project            = "test-rag"
    environment        = "dev"
    aws_region         = "us-east-1"
    lambda_memory_size = 1024
    lambda_timeout     = 120
  }

  assert {
    condition     = var.lambda_memory_size == 1024
    error_message = "Lambda memory size 1024 should be accepted"
  }

  assert {
    condition     = var.lambda_timeout == 120
    error_message = "Lambda timeout 120 should be accepted"
  }
}

# ============================================
# Test: Knowledge Base configuration
# ============================================

run "valid_kb_config" {
  command = plan

  variables {
    project                  = "test-rag"
    environment              = "dev"
    aws_region               = "us-east-1"
    chunk_max_tokens         = 500
    chunk_overlap_percentage = 10
    embedding_model_id       = "amazon.titan-embed-text-v2:0"
  }

  assert {
    condition     = var.chunk_max_tokens == 500
    error_message = "Chunk max tokens should be accepted"
  }

  assert {
    condition     = var.chunk_overlap_percentage == 10
    error_message = "Chunk overlap percentage should be accepted"
  }
}

run "different_models" {
  command = plan

  variables {
    project             = "test-rag"
    environment         = "dev"
    aws_region          = "us-east-1"
    embedding_model_id  = "cohere.embed-english-v3"
    generation_model_id = "anthropic.claude-3-haiku-20240307-v1:0"
  }

  assert {
    condition     = var.embedding_model_id == "cohere.embed-english-v3"
    error_message = "Custom embedding model should be accepted"
  }

  assert {
    condition     = var.generation_model_id == "anthropic.claude-3-haiku-20240307-v1:0"
    error_message = "Custom generation model should be accepted"
  }
}

# ============================================
# Test: OpenSearch configuration
# ============================================

run "opensearch_config" {
  command = plan

  variables {
    project                     = "test-rag"
    environment                 = "dev"
    aws_region                  = "us-east-1"
    opensearch_standby_replicas = "ENABLED"
    vector_index_name           = "custom-index"
  }

  assert {
    condition     = var.opensearch_standby_replicas == "ENABLED"
    error_message = "Standby replicas should be accepted"
  }

  assert {
    condition     = var.vector_index_name == "custom-index"
    error_message = "Custom vector index name should be accepted"
  }
}

# ============================================
# Test: S3 configuration
# ============================================

run "s3_config" {
  command = plan

  variables {
    project                   = "test-rag"
    environment               = "dev"
    aws_region                = "us-east-1"
    s3_version_retention_days = 90
    cors_allow_origins        = ["https://app.example.com"]
  }

  assert {
    condition     = var.s3_version_retention_days == 90
    error_message = "S3 version retention should be accepted"
  }

  assert {
    condition     = length(var.cors_allow_origins) == 1
    error_message = "CORS origins should be accepted"
  }
}
