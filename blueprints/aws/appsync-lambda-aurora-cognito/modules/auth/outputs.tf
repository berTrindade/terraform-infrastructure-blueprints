# modules/auth/outputs.tf
# Cognito User Pool outputs

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.endpoint
}

output "user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.this.id
}

output "user_pool_domain" {
  description = "Cognito domain (if created)"
  value       = var.create_domain ? aws_cognito_user_pool_domain.this[0].domain : null
}

output "issuer_url" {
  description = "Issuer URL for JWT validation"
  value       = "https://${aws_cognito_user_pool.this.endpoint}"
}
