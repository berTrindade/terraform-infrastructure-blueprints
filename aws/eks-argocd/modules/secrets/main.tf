# modules/secrets/main.tf
# Secrets Manager module - Flow B (Third-Party Secrets)
# Based on terraform-secrets-poc engineering standard
#
# This module creates "shell" secrets in AWS Secrets Manager.
# Engineers seed the actual values manually via CLI or console.
# Applications (pods) read secrets at runtime via AWS SDK or External Secrets Operator.
#
# Flow B Lifecycle:
#   1. Terraform creates empty secret shell
#   2. Engineer creates key in third-party (Stripe, SendGrid, etc.)
#   3. Engineer seeds value via CLI
#   4. Application reads at runtime

# ============================================
# Secret Shells for Third-Party Secrets
# ============================================

resource "aws_secretsmanager_secret" "this" {
  for_each = var.secrets

  # Naming: /{env}/{app}/{purpose}
  name        = "${var.secret_prefix}/${each.key}"
  description = each.value.description

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, {
    SecretFlow = "B-third-party"
    SecretType = lookup(each.value, "secret_type", "api-key")
    DataClass  = "secret"
  })

  lifecycle {
    prevent_destroy = false # Set to true for production!
  }
}

# ============================================
# Placeholder Version
# ============================================

resource "aws_secretsmanager_secret_version" "placeholder" {
  for_each = var.secrets

  secret_id = aws_secretsmanager_secret.this[each.key].id

  # Placeholder value - engineer must seed real value
  secret_string = jsonencode({
    _placeholder = true
    _message     = "Seed this secret using: aws secretsmanager put-secret-value"
    _created_by  = "terraform"
    _created_at  = timestamp()
  })

  lifecycle {
    # Ignore changes to secret_string - managed outside Terraform
    ignore_changes = [secret_string]
  }
}
