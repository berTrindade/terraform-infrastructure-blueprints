# modules/secrets/outputs.tf
# Secrets Manager module outputs - Flow A (TF-Generated)

output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.db.arn
}

output "secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.db.name
}

# Note: db_password output removed
# Flow A: Password goes directly to RDS via password_wo
# Applications use IAM Database Authentication
