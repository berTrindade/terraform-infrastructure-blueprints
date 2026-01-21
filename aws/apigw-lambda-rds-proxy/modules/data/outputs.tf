# modules/data/outputs.tf
# Output values for RDS + Proxy data module

# ============================================
# RDS Outputs
# ============================================

output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.this.id
}

output "db_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.this.arn
}

output "db_endpoint" {
  description = "Connection endpoint for the database (direct)"
  value       = aws_db_instance.this.endpoint
}

output "db_host" {
  description = "Hostname of the database (direct)"
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

# ============================================
# RDS Proxy Outputs
# ============================================

output "proxy_endpoint" {
  description = "Connection endpoint for RDS Proxy"
  value       = aws_db_proxy.this.endpoint
}

output "proxy_arn" {
  description = "ARN of the RDS Proxy"
  value       = aws_db_proxy.this.arn
}

output "proxy_name" {
  description = "Name of the RDS Proxy"
  value       = aws_db_proxy.this.name
}

# ============================================
# RDS-Managed Secret Outputs
# ============================================

output "master_user_secret_arn" {
  description = "ARN of the RDS-managed master user secret"
  value       = aws_db_instance.this.master_user_secret[0].secret_arn
}

output "db_resource_id" {
  description = "Resource ID of the RDS instance (for IAM authentication)"
  value       = aws_db_instance.this.resource_id
}
