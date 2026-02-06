output "api_endpoint" {
  description = "Base URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the API Lambda function"
  value       = module.api_lambda.lambda_function_name
}

output "queue_url" {
  description = "URL of the SQS work queue"
  value       = module.queue.queue_url
}

output "worker_lambda_name" {
  description = "Name of the worker Lambda function"
  value       = module.worker_lambda.lambda_function_name
}
