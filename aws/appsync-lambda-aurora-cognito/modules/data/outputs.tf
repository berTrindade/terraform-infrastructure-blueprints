# modules/data/outputs.tf
# Output values for Aurora Serverless v2 data module

output "cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.this.id
}

output "cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.this.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.this.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = aws_rds_cluster.this.reader_endpoint
}

output "db_host" {
  description = "Hostname of the Aurora cluster (writer)"
  value       = aws_rds_cluster.this.endpoint
}

output "db_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.this.port
}

output "db_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.this.database_name
}

output "db_username" {
  description = "Master username"
  value       = aws_rds_cluster.this.master_username
}

output "instance_ids" {
  description = "IDs of the Aurora instances"
  value       = aws_rds_cluster_instance.this[*].id
}

output "cluster_resource_id" {
  description = "Resource ID of the Aurora cluster (for IAM authentication)"
  value       = aws_rds_cluster.this.cluster_resource_id
}
