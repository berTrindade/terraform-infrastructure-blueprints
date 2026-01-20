# modules/secrets/main.tf
# Database credentials in Secrets Manager

resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db" {
  name                    = var.secret_name
  recovery_window_in_days = var.recovery_window_in_days
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    host     = var.db_host
    port     = var.db_port
    database = var.db_name
  })
}
