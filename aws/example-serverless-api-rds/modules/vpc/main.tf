# modules/vpc/main.tf
# VPC module for Serverless REST API with RDS
# Creates minimal VPC with private subnets for Lambda and RDS

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================
# VPC
# ============================================

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = var.vpc_name
  })
}

# ============================================
# Private Subnets (for Lambda and RDS)
# ============================================

resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.subnet_name_prefix}-${count.index + 1}"
    Type = "private"
  })
}

# ============================================
# DB Subnet Group
# ============================================

resource "aws_db_subnet_group" "this" {
  name       = var.db_subnet_group_name
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.tags, {
    Name = var.db_subnet_group_name
  })
}

# ============================================
# Security Groups
# ============================================

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name        = "${var.security_group_prefix}-lambda"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.this.id

  # Outbound to RDS
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
    description     = "PostgreSQL to RDS"
  }

  # Outbound to Secrets Manager (via VPC endpoint or NAT)
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS APIs"
  }

  tags = merge(var.tags, {
    Name = "${var.security_group_prefix}-lambda"
  })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.security_group_prefix}-rds"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.security_group_prefix}-rds"
  })
}

# RDS ingress rule (separate to avoid circular dependency)
resource "aws_security_group_rule" "rds_ingress" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "PostgreSQL from Lambda"
}

# ============================================
# VPC Endpoints (for AWS services without NAT)
# ============================================

resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-secretsmanager-endpoint"
  })
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.security_group_prefix}-vpc-endpoints"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
    description     = "HTTPS from Lambda"
  }

  tags = merge(var.tags, {
    Name = "${var.security_group_prefix}-vpc-endpoints"
  })
}
