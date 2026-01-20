# modules/naming/outputs.tf

output "prefix" {
  value = local.prefix
}

output "documents_bucket" {
  value = local.names.documents_bucket
}

output "opensearch_collection" {
  value = local.names.opensearch_collection
}

output "knowledge_base" {
  value = local.names.knowledge_base
}

output "data_source" {
  value = local.names.data_source
}

output "api_gateway" {
  value = local.names.api_gateway
}

output "api_lambda" {
  value = local.names.api_lambda
}

output "lambda_role" {
  value = local.names.lambda_role
}

output "knowledge_base_role" {
  value = local.names.knowledge_base_role
}

output "log_group_api" {
  value = local.names.log_group_api
}
