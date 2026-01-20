# modules/secrets/main.tf
# Secrets Manager module for database credentials
# Generates secure password and stores in Secrets Manager

# ============================================
# Random Password Generation
# ============================================

resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ============================================
# Secrets Manager Secret
# ============================================

resource "aws_secretsmanager_secret" "db" {
  name                    = var.secret_name
  description             = "Database credentials for ${var.db_identifier}"
  recovery_window_in_days = var.recovery_window_in_days

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    engine   = "postgres"
    host     = var.db_host
    port     = var.db_port
    dbname   = var.db_name
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
