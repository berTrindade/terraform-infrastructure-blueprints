# modules/data/main.tf
# RDS PostgreSQL module for Serverless REST API
# Creates a simple RDS PostgreSQL instance

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
  password = var.db_password
  port     = 5432

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
  deletion_protection      = var.deletion_protection
  skip_final_snapshot      = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.db_identifier}-final"

  # Apply changes immediately in dev (false for prod)
  apply_immediately = var.apply_immediately

  tags = merge(var.tags, {
    Name = var.db_identifier
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
