# modules/api/outputs.tf
# AppSync API module outputs

output "api_id" {
  description = "ID of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.this.id
}

output "api_arn" {
  description = "ARN of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.this.arn
}

output "api_uris" {
  description = "Map of URIs for the AppSync GraphQL API"
  value = {
    graphql = aws_appsync_graphql_api.this.uris.GRAPHQL
    realtime = aws_appsync_graphql_api.this.uris.REALTIME
  }
}

output "api_key" {
  description = "API key (if created)"
  value       = var.create_api_key ? aws_appsync_api_key.this[0].key : null
  sensitive   = true
}

output "datasource_id" {
  description = "ID of the Lambda data source"
  value       = aws_appsync_datasource.lambda.id
}
