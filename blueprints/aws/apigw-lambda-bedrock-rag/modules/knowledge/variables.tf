# modules/knowledge/variables.tf

variable "knowledge_base_name" {
  description = "Name of the Bedrock Knowledge Base"
  type        = string
}

variable "data_source_name" {
  description = "Name of the data source"
  type        = string
}

variable "role_name" {
  description = "Name of the IAM role for Knowledge Base"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket containing documents"
  type        = string
}

variable "opensearch_collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  type        = string
}

variable "vector_index_name" {
  description = "Name of the vector index in OpenSearch"
  type        = string
  default     = "bedrock-knowledge-base-default-index"
}

variable "embedding_model_id" {
  description = "Bedrock embedding model ID"
  type        = string
  default     = "amazon.titan-embed-text-v2:0"
}

variable "chunk_max_tokens" {
  description = "Maximum tokens per chunk"
  type        = number
  default     = 300
}

variable "chunk_overlap_percentage" {
  description = "Overlap percentage between chunks"
  type        = number
  default     = 20
}

variable "tags" {
  type    = map(string)
  default = {}
}
