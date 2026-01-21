# modules/secrets/outputs.tf
# Secrets Manager module outputs - AWS-Managed Master Password

output "metadata_secret_arn" {
  description = "ARN of the metadata secret (connection info, no password)"
  value       = aws_secretsmanager_secret.db_metadata.arn
}

output "metadata_secret_name" {
  description = "Name of the metadata secret"
  value       = aws_secretsmanager_secret.db_metadata.name
}

# Note: db_password output removed
# For RDS Proxy: Password is in the RDS-managed secret
# Proxy reads credentials directly from that secret
