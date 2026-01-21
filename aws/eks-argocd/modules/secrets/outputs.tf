# modules/secrets/outputs.tf
# Flow B (Third-Party Secrets) outputs

output "secret_arns" {
  description = "Map of secret keys to their ARNs (for IAM policies)"
  value = {
    for k, v in aws_secretsmanager_secret.this : k => v.arn
  }
}

output "secret_names" {
  description = "Map of secret keys to their full names"
  value = {
    for k, v in aws_secretsmanager_secret.this : k => v.name
  }
}

output "secret_ids" {
  description = "Map of secret keys to their IDs"
  value = {
    for k, v in aws_secretsmanager_secret.this : k => v.id
  }
}

output "all_secret_arns" {
  description = "List of all secret ARNs (for IAM policy with multiple secrets)"
  value       = [for v in aws_secretsmanager_secret.this : v.arn]
}
