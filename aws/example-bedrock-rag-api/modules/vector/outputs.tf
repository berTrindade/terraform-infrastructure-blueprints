# modules/vector/outputs.tf

output "collection_id" {
  value = aws_opensearchserverless_collection.this.id
}

output "collection_arn" {
  value = aws_opensearchserverless_collection.this.arn
}

output "collection_endpoint" {
  value = aws_opensearchserverless_collection.this.collection_endpoint
}

output "collection_name" {
  value = aws_opensearchserverless_collection.this.name
}

output "dashboard_endpoint" {
  value = aws_opensearchserverless_collection.this.dashboard_endpoint
}
