output "app_engine_url" {
  description = "URL of the App Engine application"
  value       = "https://${module.compute.default_hostname}"
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.data.connection_name
}

output "cloud_sql_private_ip" {
  description = "Private IP address of Cloud SQL instance"
  value       = module.data.private_ip_address
}

output "database_name" {
  description = "Name of the database"
  value       = module.data.database_name
}

output "storage_bucket_name" {
  description = "Name of the Cloud Storage bucket"
  value       = module.storage.bucket_name
}

output "storage_service_account_email" {
  description = "Email of the storage service account"
  value       = module.storage.service_account_email
}

output "vpc_connector_name" {
  description = "Name of the VPC connector"
  value       = module.networking.vpc_connector_name
}
