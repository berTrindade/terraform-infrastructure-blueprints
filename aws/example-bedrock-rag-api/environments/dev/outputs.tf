# environments/dev/outputs.tf

output "api_endpoint" {
  description = "Base URL of the API"
  value       = module.api_gateway.api_endpoint
}

output "query_endpoint" {
  description = "POST endpoint for RAG queries"
  value       = "${module.api_gateway.api_endpoint}/query"
}

output "ingest_endpoint" {
  description = "POST endpoint for document upload URLs"
  value       = "${module.api_gateway.api_endpoint}/ingest"
}

output "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID"
  value       = module.knowledge.knowledge_base_id
}

output "data_source_id" {
  description = "Knowledge Base Data Source ID"
  value       = module.knowledge.data_source_id
}

output "documents_bucket" {
  description = "S3 bucket for documents"
  value       = module.storage.bucket_name
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless endpoint"
  value       = module.vector.collection_endpoint
}

output "opensearch_dashboard" {
  description = "OpenSearch Dashboards URL"
  value       = module.vector.dashboard_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.api_lambda.lambda_function_name
}

output "lambda_log_group" {
  description = "CloudWatch log group"
  value       = module.api_lambda.cloudwatch_log_group_name
}
