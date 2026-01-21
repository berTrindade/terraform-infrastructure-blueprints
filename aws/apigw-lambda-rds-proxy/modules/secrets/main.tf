# modules/secrets/main.tf
# Secrets Manager module - AWS-Managed Master Password
# Based on terraform-secrets-poc engineering standard
#
# For RDS Proxy scenarios, the password MUST be in Secrets Manager
# because the Proxy reads credentials from there.
#
# This module uses manage_master_user_password on RDS which:
#   1. AWS automatically creates and manages the password
#   2. Password is stored in an RDS-managed Secrets Manager secret
#   3. RDS Proxy can authenticate using this managed secret
#   4. Applications connect via Proxy (connection pooling)
#
# Note: This creates an additional metadata secret for application use
# that contains connection info but NO password (for security).

# ============================================
# Secrets Manager Secret (Metadata Only)
# ============================================

resource "aws_secretsmanager_secret" "db_metadata" {
  name        = var.secret_name
  description = "Database connection metadata for ${var.db_identifier}. Password managed by RDS."

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    SecretFlow = "A-rds-managed"
    SecretType = "database-metadata"
    DataClass  = "internal"
  })

  lifecycle {
    prevent_destroy = false # Set to true for production!
  }
}

resource "aws_secretsmanager_secret_version" "db_metadata" {
  secret_id = aws_secretsmanager_secret.db_metadata.id

  # Connection metadata only - NO PASSWORD
  # Password is in the RDS-managed secret (used by Proxy)
  secret_string = jsonencode({
    username   = var.db_username
    host       = var.db_host
    proxy_host = var.proxy_host
    port       = var.db_port
    dbname     = var.db_name
    engine     = "postgres"
    # Note: Password managed by RDS in separate secret
    # Use proxy_host for connections (includes connection pooling)
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
