# modules/data/main.tf
# RDS PostgreSQL + RDS Proxy - AWS-Managed Master Password
# Based on terraform-secrets-poc engineering standard
#
# For RDS Proxy scenarios, uses manage_master_user_password which:
#   1. AWS automatically creates and rotates the password
#   2. Password stored in RDS-managed Secrets Manager secret
#   3. RDS Proxy authenticates using this managed secret
#   4. Password NEVER in Terraform state

# ============================================
# RDS PostgreSQL Instance
# ============================================

resource "aws_db_instance" "this" {
  identifier = var.db_identifier

  # Engine configuration
  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.this.name

  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database configuration
  db_name  = var.db_name
  username = var.db_username

  # AWS-Managed Master Password
  # - AWS creates and manages the password automatically
  # - Stored in RDS-managed Secrets Manager secret
  # - RDS Proxy uses this secret for authentication
  # - Password NEVER in Terraform state
  manage_master_user_password = true

  port = 5432

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.rds_security_group_id]
  publicly_accessible    = false
  multi_az               = var.multi_az

  # IAM authentication (for direct connections if needed)
  iam_database_authentication_enabled = true

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Performance and monitoring
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval

  # Deletion protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.db_identifier}-final"

  # Apply changes immediately in dev (false for prod)
  apply_immediately = var.apply_immediately

  tags = merge(var.tags, {
    Name       = var.db_identifier
    SecretFlow = "A-rds-managed"
    DataClass  = "secret"
  })
}

# ============================================
# Parameter Group
# ============================================

resource "aws_db_parameter_group" "this" {
  name   = "${var.db_identifier}-params"
  family = "postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries over 1 second
  }

  tags = var.tags
}

# ============================================
# RDS Proxy
# ============================================

resource "aws_db_proxy" "this" {
  name                   = var.proxy_name
  debug_logging          = var.proxy_debug_logging
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = var.proxy_idle_timeout
  require_tls            = true
  role_arn               = aws_iam_role.proxy.arn
  vpc_security_group_ids = [var.proxy_security_group_id]
  vpc_subnet_ids         = var.subnet_ids

  auth {
    auth_scheme               = "SECRETS"
    iam_auth                  = "DISABLED"
    # Use the RDS-managed secret for authentication
    secret_arn                = aws_db_instance.this.master_user_secret[0].secret_arn
    client_password_auth_type = "POSTGRES_SCRAM_SHA_256"
  }

  tags = var.tags

  depends_on = [aws_db_instance.this]
}

resource "aws_db_proxy_default_target_group" "this" {
  db_proxy_name = aws_db_proxy.this.name

  connection_pool_config {
    connection_borrow_timeout    = var.proxy_connection_borrow_timeout
    max_connections_percent      = var.proxy_max_connections_percent
    max_idle_connections_percent = var.proxy_max_idle_connections_percent
  }
}

resource "aws_db_proxy_target" "this" {
  db_proxy_name          = aws_db_proxy.this.name
  target_group_name      = aws_db_proxy_default_target_group.this.name
  db_instance_identifier = aws_db_instance.this.identifier
}

# ============================================
# RDS Proxy IAM Role
# ============================================

resource "aws_iam_role" "proxy" {
  name = var.proxy_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "proxy" {
  name        = "${var.proxy_role_name}-policy"
  description = "Allow RDS Proxy to read database credentials from RDS-managed secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        # Use the RDS-managed secret ARN
        Resource = [aws_db_instance.this.master_user_secret[0].secret_arn]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "proxy" {
  role       = aws_iam_role.proxy.name
  policy_arn = aws_iam_policy.proxy.arn
}
