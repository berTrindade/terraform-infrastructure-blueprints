# modules/vpc/outputs.tf
# Output values for VPC module

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.this.name
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "aurora_security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = data.aws_availability_zones.available.names
}
