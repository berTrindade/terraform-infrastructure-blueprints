# modules/knowledge/main.tf
# Bedrock Knowledge Base with S3 data source

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Bedrock Knowledge Base
resource "aws_bedrockagent_knowledge_base" "this" {
  name     = var.knowledge_base_name
  role_arn = aws_iam_role.knowledge_base.arn

  knowledge_base_configuration {
    type = "VECTOR"

    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/${var.embedding_model_id}"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"

    opensearch_serverless_configuration {
      collection_arn    = var.opensearch_collection_arn
      vector_index_name = var.vector_index_name

      field_mapping {
        metadata_field = "metadata"
        text_field     = "text"
        vector_field   = "vector"
      }
    }
  }

  tags = var.tags
}

# Data Source (S3)
resource "aws_bedrockagent_data_source" "s3" {
  name                 = var.data_source_name
  knowledge_base_id    = aws_bedrockagent_knowledge_base.this.id
  data_deletion_policy = "RETAIN"

  data_source_configuration {
    type = "S3"

    s3_configuration {
      bucket_arn = var.s3_bucket_arn
    }
  }

  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "FIXED_SIZE"

      fixed_size_chunking_configuration {
        max_tokens         = var.chunk_max_tokens
        overlap_percentage = var.chunk_overlap_percentage
      }
    }
  }
}
