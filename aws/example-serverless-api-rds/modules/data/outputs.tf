# modules/data/outputs.tf
# Output values for RDS data module

output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.this.id
}

output "db_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}

output "db_endpoint" {
  description = "Connection endpoint for the database"
  value       = aws_db_instance.this.endpoint
}

output "db_host" {
  description = "Hostname of the database"
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "Port of the database"
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.this.db_name
}

output "db_username" {
  description = "Master username"
  value       = aws_db_instance.this.username
}
