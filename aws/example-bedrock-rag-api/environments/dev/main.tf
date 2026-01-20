# environments/dev/main.tf

module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

module "tagging" {
  source          = "../../modules/tagging"
  project         = var.project
  environment     = var.environment
  repository      = var.repository
  additional_tags = var.additional_tags
}

module "storage" {
  source                 = "../../modules/storage"
  bucket_name            = module.naming.documents_bucket
  cors_allowed_origins   = var.cors_allow_origins
  version_retention_days = var.s3_version_retention_days
  tags                   = module.tagging.tags
}

module "vector" {
  source           = "../../modules/vector"
  collection_name  = module.naming.opensearch_collection
  standby_replicas = var.opensearch_standby_replicas
  # Knowledge base role will be added via data access policy update
  additional_principals = []
  tags                  = module.tagging.tags
}

module "knowledge" {
  source                    = "../../modules/knowledge"
  knowledge_base_name       = module.naming.knowledge_base
  data_source_name          = module.naming.data_source
  role_name                 = module.naming.knowledge_base_role
  s3_bucket_arn             = module.storage.bucket_arn
  opensearch_collection_arn = module.vector.collection_arn
  vector_index_name         = var.vector_index_name
  embedding_model_id        = var.embedding_model_id
  chunk_max_tokens          = var.chunk_max_tokens
  chunk_overlap_percentage  = var.chunk_overlap_percentage
  tags                      = module.tagging.tags

  depends_on = [module.vector]
}

# Update OpenSearch data access policy to include Knowledge Base role
resource "aws_opensearchserverless_access_policy" "kb_access" {
  name = "${module.naming.opensearch_collection}-kb"
  type = "data"

  policy = jsonencode([{
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${module.naming.opensearch_collection}"]
      Permission   = [
        "aoss:CreateCollectionItems",
        "aoss:DeleteCollectionItems",
        "aoss:UpdateCollectionItems",
        "aoss:DescribeCollectionItems"
      ]
    }, {
      ResourceType = "index"
      Resource     = ["index/${module.naming.opensearch_collection}/*"]
      Permission   = [
        "aoss:CreateIndex",
        "aoss:DeleteIndex",
        "aoss:UpdateIndex",
        "aoss:DescribeIndex",
        "aoss:ReadDocument",
        "aoss:WriteDocument"
      ]
    }]
    Principal = [module.knowledge.knowledge_base_role_arn]
  }])

  depends_on = [module.knowledge]
}

module "api" {
  source              = "../../modules/api"
  api_name            = module.naming.api_gateway
  cors_allow_origins  = var.cors_allow_origins
  function_name       = module.naming.api_lambda
  role_name           = module.naming.lambda_role
  log_group_name      = module.naming.log_group_api
  source_dir          = "${path.module}/../../src/api"
  memory_size         = var.lambda_memory_size
  timeout             = var.lambda_timeout
  knowledge_base_id   = module.knowledge.knowledge_base_id
  data_source_id      = module.knowledge.data_source_id
  generation_model_id = var.generation_model_id
  s3_bucket_name      = module.storage.bucket_name
  s3_bucket_arn       = module.storage.bucket_arn
  log_retention_days  = var.log_retention_days
  tags                = module.tagging.tags
}
