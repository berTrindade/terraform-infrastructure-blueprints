# modules/api/outputs.tf
# Output values for API module

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.this.id
}

output "api_name" {
  description = "API Gateway name"
  value       = aws_apigatewayv2_api.this.name
}

output "events_endpoint" {
  description = "Full URL for POST /events"
  value       = "${aws_apigatewayv2_api.this.api_endpoint}/events"
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.api.name
}
