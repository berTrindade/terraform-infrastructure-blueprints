# modules/api/outputs.tf
# API module outputs
# Based on terraform-skill module-patterns (output best practices)

output "api_id" {
  description = "ID of the API Gateway HTTP API"
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Invoke URL for the API Gateway (use for HTTP requests)"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "api_role_arn" {
  description = "ARN of the API Gateway execution role"
  value       = aws_iam_role.api_gateway.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api.name
}
