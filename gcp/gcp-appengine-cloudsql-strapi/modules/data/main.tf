# modules/data/main.tf
# Cloud SQL PostgreSQL with private IP

resource "google_sql_database_instance" "this" {
  name             = var.instance_name
  project          = var.project_id
  region           = var.region
  database_version = var.database_version

  settings {
    tier      = var.database_tier
    disk_size = var.disk_size
    disk_type = var.disk_type

    backup_configuration {
      enabled                        = var.backup_enabled
      point_in_time_recovery_enabled = var.pitr_enabled
    }

    ip_configuration {
      ipv4_enabled    = var.enable_public_ip
      private_network = var.enable_public_ip ? null : var.vpc_network_id
    }
  }

  deletion_protection = var.deletion_protection

  depends_on = var.enable_public_ip ? [] : (var.vpc_peering_connection != null ? [var.vpc_peering_connection] : [])
}

resource "google_sql_database" "this" {
  name     = var.database_name
  project  = var.project_id
  instance = google_sql_database_instance.this.name
}

resource "google_sql_user" "this" {
  name     = var.database_user
  project  = var.project_id
  instance = google_sql_database_instance.this.name
  password = var.database_password

  lifecycle {
    ignore_changes = [password]
  }
}
