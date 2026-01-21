# modules/data/main.tf
# RDS PostgreSQL - Flow A (TF-Generated Password)
# Based on terraform-secrets-poc engineering standard
#
# Password handling:
#   1. Ephemeral password generated at environment level (never in state)
#   2. Sent to RDS via password_wo (write-only)
#   3. Bump password_wo_version to rotate
#   4. Applications use IAM Database Authentication

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

  # Flow A: Write-only password
  # - Generated ephemerally at environment level
  # - Sent to AWS during apply
  # - NEVER stored in terraform.tfstate
  # - Bump password_wo_version to rotate
  password_wo         = var.db_password
  password_wo_version = var.db_password_version

  port = 5432

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.security_group_id]
  publicly_accessible    = false
  multi_az               = var.multi_az

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

  # Enable IAM Database Authentication
  # Applications connect using IAM tokens instead of passwords
  iam_database_authentication_enabled = true

  tags = merge(var.tags, {
    Name       = var.db_identifier
    SecretFlow = "A-tf-generated"
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
