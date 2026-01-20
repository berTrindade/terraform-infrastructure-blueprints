# modules/secrets/outputs.tf
# Output values for secrets module

output "secret_arn" {
  description = "ARN of the secret"
  value       = aws_secretsmanager_secret.db.arn
}

output "secret_name" {
  description = "Name of the secret"
  value       = aws_secretsmanager_secret.db.name
}

output "db_password" {
  description = "Generated database password"
  value       = random_password.db.result
  sensitive   = true
}
