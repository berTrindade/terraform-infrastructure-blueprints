# modules/api/outputs.tf

output "api_endpoint" {
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "items_endpoint" {
  value = "${aws_apigatewayv2_api.this.api_endpoint}/items"
}

output "lambda_function_name" {
  value = aws_lambda_function.this.function_name
}

output "lambda_log_group" {
  value = aws_cloudwatch_log_group.lambda.name
}
