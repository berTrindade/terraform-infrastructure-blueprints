# modules/compute/outputs.tf
# Output values for Lambda compute module

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.this.arn
}

output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.this.function_name
}

output "function_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.this.invoke_arn
}

output "appsync_service_role_arn" {
  description = "ARN of the IAM role that allows AppSync to invoke Lambda"
  value       = aws_iam_role.appsync_lambda.arn
}
