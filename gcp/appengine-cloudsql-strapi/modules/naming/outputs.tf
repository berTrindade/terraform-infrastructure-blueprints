output "prefix" {
  description = "Base prefix for all resources"
  value       = local.prefix
}

output "cloud_sql_instance" {
  description = "Cloud SQL instance name"
  value       = local.names.cloud_sql_instance
}

output "database" {
  description = "Database name"
  value       = local.names.database
}

output "storage_bucket" {
  description = "Storage bucket name"
  value       = local.names.storage_bucket
}

output "vpc_network" {
  description = "VPC network name"
  value       = local.names.vpc_network
}

output "subnet" {
  description = "Subnet name"
  value       = local.names.subnet
}

output "vpc_connector" {
  description = "VPC connector name"
  value       = local.names.vpc_connector
}

output "private_ip_alloc" {
  description = "Private IP allocation name"
  value       = local.names.private_ip_alloc
}

output "storage_service_account" {
  description = "Storage service account name"
  value       = local.names.storage_service_account
}
