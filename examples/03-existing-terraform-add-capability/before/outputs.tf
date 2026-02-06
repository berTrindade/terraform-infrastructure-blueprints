output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = module.api_lambda.lambda_function_name
}
