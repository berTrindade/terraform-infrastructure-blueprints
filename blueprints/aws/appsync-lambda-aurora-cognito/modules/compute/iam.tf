# modules/compute/iam.tf
# IAM role and policies for Lambda function

# ============================================
# Lambda Execution Role
# ============================================

resource "aws_iam_role" "lambda" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# ============================================
# Policy Attachments
# ============================================

# Basic Lambda execution (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC access for Lambda
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ============================================
# Secrets Manager Access
# ============================================

resource "aws_iam_policy" "secrets" {
  name        = "${var.role_name}-secrets"
  description = "Allow Lambda to read database credentials"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [var.db_secret_arn]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.secrets.arn
}

# ============================================
# RDS IAM Database Authentication
# ============================================

resource "aws_iam_policy" "rds_auth" {
  name        = "${var.role_name}-rds-auth"
  description = "Allow Lambda to authenticate to RDS using IAM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.aws_region}:${data.aws_caller_identity.current.account_id}:dbuser:${var.cluster_resource_id}/${var.db_username}"
      }
    ]
  })

  tags = var.tags
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role_policy_attachment" "lambda_rds" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.rds_auth.arn
}
