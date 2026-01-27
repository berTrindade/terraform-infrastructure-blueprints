output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.invoice_api.api_endpoint
}

output "api_stage_url" {
  description = "Full API Gateway stage URL"
  value       = "${aws_apigatewayv2_api.invoice_api.api_endpoint}/${aws_apigatewayv2_stage.invoice_api_stage.name}"
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.invoice_handler.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.invoice_handler.arn
}

# TODO: Add database outputs after RDS is added
# output "db_endpoint" {
#   description = "RDS database endpoint"
#   value       = aws_db_instance.invoice_db.endpoint
# }
#
# output "db_secret_arn" {
#   description = "Secrets Manager secret ARN for database credentials"
#   value       = aws_secretsmanager_secret.db_credentials.arn
# }
