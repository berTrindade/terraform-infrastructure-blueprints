output "instance_id" {
  description = "ID of the Cloud SQL instance"
  value       = google_sql_database_instance.this.id
}

output "instance_name" {
  description = "Name of the Cloud SQL instance"
  value       = google_sql_database_instance.this.name
}

output "connection_name" {
  description = "Connection name for Cloud SQL"
  value       = google_sql_database_instance.this.connection_name
}

output "private_ip_address" {
  description = "Private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.this.private_ip_address
}

output "database_name" {
  description = "Name of the database"
  value       = google_sql_database.this.name
}

output "database_user" {
  description = "Database user name"
  value       = google_sql_user.this.name
}
