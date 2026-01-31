# modules/api/outputs.tf

output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "items_endpoint" {
  description = "Full URL for items endpoint"
  value       = "${aws_apigatewayv2_api.this.api_endpoint}/items"
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "lambda_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}
