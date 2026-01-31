# environments/dev/outputs.tf

output "app_url" {
  description = "Amplify app URL"
  value       = module.hosting.app_url
}

output "amplify_app_id" {
  description = "Amplify app ID"
  value       = module.hosting.app_id
}

output "default_domain" {
  description = "Amplify default domain"
  value       = module.hosting.default_domain
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.auth.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.auth.user_pool_client_id
}

output "hosted_ui_url" {
  description = "Cognito Hosted UI URL"
  value       = module.auth.hosted_ui_url
}

output "cognito_domain" {
  description = "Cognito domain"
  value       = module.auth.cognito_domain
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api.api_endpoint
}

output "items_endpoint" {
  description = "Items API endpoint URL"
  value       = module.api.items_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.api.lambda_function_name
}
