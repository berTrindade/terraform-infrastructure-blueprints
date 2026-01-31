# modules/api/outputs.tf

output "api_id" {
  value = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.this.api_endpoint
}

output "query_endpoint" {
  value = "${aws_apigatewayv2_api.this.api_endpoint}/query"
}

output "ingest_endpoint" {
  value = "${aws_apigatewayv2_api.this.api_endpoint}/ingest"
}

output "lambda_function_name" {
  value = aws_lambda_function.this.function_name
}

output "lambda_log_group" {
  value = aws_cloudwatch_log_group.lambda.name
}
