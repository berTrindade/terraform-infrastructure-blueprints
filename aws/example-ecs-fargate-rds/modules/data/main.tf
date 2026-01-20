# modules/data/main.tf
# RDS PostgreSQL

resource "aws_db_instance" "this" {
  identifier = var.db_instance_identifier

  engine               = "postgres"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type         = var.db_storage_type
  storage_encrypted    = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.db_security_group_id]
  db_subnet_group_name   = var.db_subnet_group_name

  multi_az               = var.multi_az
  publicly_accessible    = false
  skip_final_snapshot    = var.skip_final_snapshot
  deletion_protection    = var.deletion_protection

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  performance_insights_enabled = var.enable_performance_insights

  tags = var.tags
}
