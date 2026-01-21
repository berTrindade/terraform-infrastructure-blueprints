# modules/secrets/main.tf
# Secrets Manager module - Flow A (TF-Generated)
# Based on terraform-secrets-poc engineering standard
#
# This module creates a Secrets Manager secret for database metadata.
# The password is NOT stored here - it goes directly to RDS via password_wo.
# Applications use IAM Database Authentication for secure access.
#
# Flow A Lifecycle:
#   1. Terraform generates ephemeral password (never in state)
#   2. Password sent to RDS via password_wo (write-only)
#   3. Secret stores connection metadata only (no password)
#   4. Applications use IAM Database Authentication

# ============================================
# Secrets Manager Secret (Metadata Only)
# ============================================

resource "aws_secretsmanager_secret" "db" {
  name        = var.secret_name
  description = "Database connection metadata for ${var.db_identifier}. Password managed via IAM Database Authentication."

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    SecretFlow = "A-tf-generated"
    SecretType = "database-metadata"
    DataClass  = "internal"
  })

  lifecycle {
    prevent_destroy = false # Set to true for production!
  }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id

  # Connection metadata only - NO PASSWORD
  # Applications use IAM Database Authentication
  secret_string = jsonencode({
    username = var.db_username
    host     = var.db_host
    port     = var.db_port
    dbname   = var.db_name
    engine   = "postgres"
    # Note: Password not stored. Use IAM Database Authentication.
    # See: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
