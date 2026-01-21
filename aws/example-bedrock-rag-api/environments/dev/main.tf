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

# ============================================
# API Layer: Lambda (Official Module)
# ============================================
# Routes are defined in var.api_routes - add new routes there!

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

module "api_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = module.naming.api_lambda
  description   = "RAG query handler for Bedrock Knowledge Base"
  handler       = "index.handler"
  runtime       = "nodejs20.x"

  source_path = "${path.module}/../../src/api"

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  environment_variables = {
    KNOWLEDGE_BASE_ID = module.knowledge.knowledge_base_id
    MODEL_ID          = var.generation_model_id
    S3_BUCKET         = module.storage.bucket_name
    DATA_SOURCE_ID    = module.knowledge.data_source_id
  }

  # CloudWatch Logs
  cloudwatch_logs_retention_in_days = var.log_retention_days

  # IAM permissions for Bedrock and S3
  attach_policy_statements = true
  policy_statements = {
    bedrock_retrieve = {
      effect = "Allow"
      actions = [
        "bedrock:RetrieveAndGenerate",
        "bedrock:Retrieve"
      ]
      resources = ["arn:${data.aws_partition.current.partition}:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:knowledge-base/${module.knowledge.knowledge_base_id}"]
    }
    bedrock_invoke = {
      effect    = "Allow"
      actions   = ["bedrock:InvokeModel"]
      resources = ["arn:${data.aws_partition.current.partition}:bedrock:${data.aws_region.current.name}::foundation-model/${var.generation_model_id}"]
    }
    bedrock_ingestion = {
      effect = "Allow"
      actions = [
        "bedrock:StartIngestionJob",
        "bedrock:GetIngestionJob",
        "bedrock:ListIngestionJobs"
      ]
      resources = ["arn:${data.aws_partition.current.partition}:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:knowledge-base/${module.knowledge.knowledge_base_id}"]
    }
    s3 = {
      effect = "Allow"
      actions = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        module.storage.bucket_arn,
        "${module.storage.bucket_arn}/*"
      ]
    }
  }

  # API Gateway trigger
  allowed_triggers = {
    APIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  tags = module.tagging.tags
}

# ============================================
# API Gateway v2 (Official Module)
# ============================================
# Routes are dynamically generated from var.api_routes

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = module.naming.api_gateway
  description   = "RAG API for Bedrock Knowledge Base"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  # Dynamic routes from var.api_routes - like serverless.yml!
  create_routes_and_integrations = true
  routes = {
    for name, config in var.api_routes : "${config.method} ${config.path}" => {
      integration = {
        uri                    = module.api_lambda.lambda_function_arn
        type                   = "AWS_PROXY"
        payload_format_version = "2.0"
      }
    }
  }

  tags = module.tagging.tags
}
