# modules/data/main.tf
# Aurora Serverless v2 module for Serverless REST API
# Creates an Aurora Serverless v2 PostgreSQL cluster with auto-scaling

# ============================================
# Aurora Serverless v2 Cluster
# ============================================

resource "aws_rds_cluster" "this" {
  cluster_identifier = var.cluster_identifier

  # Engine configuration
  engine         = "aurora-postgresql"
  engine_mode    = "provisioned" # v2 uses provisioned mode
  engine_version = var.engine_version

  # Database configuration
  database_name   = var.db_name
  master_username = var.db_username
  master_password = var.db_password
  port            = 5432

  # Serverless v2 scaling
  serverlessv2_scaling_configuration {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }

  # Network configuration
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.security_group_id]

  # Storage configuration
  storage_encrypted = true

  # Backup configuration
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"

  # Deletion protection
  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.cluster_identifier}-final"

  # Apply changes immediately in dev
  apply_immediately = var.apply_immediately

  # Enable IAM authentication
  iam_database_authentication_enabled = true

  tags = merge(var.tags, {
    Name = var.cluster_identifier
  })
}

# ============================================
# Aurora Serverless v2 Instance
# ============================================

resource "aws_rds_cluster_instance" "this" {
  count = var.instance_count

  identifier         = "${var.cluster_identifier}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = "db.serverless" # Required for Serverless v2
  engine             = aws_rds_cluster.this.engine
  engine_version     = aws_rds_cluster.this.engine_version

  # Performance monitoring
  performance_insights_enabled = var.performance_insights_enabled

  # Apply changes immediately in dev
  apply_immediately = var.apply_immediately

  tags = merge(var.tags, {
    Name = "${var.cluster_identifier}-${count.index + 1}"
  })
}

# ============================================
# Cluster Parameter Group (optional tuning)
# ============================================

resource "aws_rds_cluster_parameter_group" "this" {
  name   = "${var.cluster_identifier}-params"
  family = "aurora-postgresql15"

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
