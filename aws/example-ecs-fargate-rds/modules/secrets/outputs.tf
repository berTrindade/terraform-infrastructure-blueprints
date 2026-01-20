# modules/secrets/outputs.tf

output "secret_arn" {
  value = aws_secretsmanager_secret.db.arn
}

output "secret_name" {
  value = aws_secretsmanager_secret.db.name
}

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
