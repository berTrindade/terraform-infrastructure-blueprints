# modules/knowledge/outputs.tf

output "knowledge_base_id" {
  description = "ID of the Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.this.id
}

output "knowledge_base_arn" {
  description = "ARN of the Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.this.arn
}

output "data_source_id" {
  description = "ID of the data source"
  value       = aws_bedrockagent_data_source.s3.data_source_id
}

output "knowledge_base_role_arn" {
  description = "ARN of the Knowledge Base IAM role"
  value       = aws_iam_role.knowledge_base.arn
}
