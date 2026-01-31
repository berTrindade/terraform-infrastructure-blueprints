# modules/knowledge/iam.tf
# IAM role for Bedrock Knowledge Base

data "aws_partition" "current" {}

resource "aws_iam_role" "knowledge_base" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "bedrock.amazonaws.com"
      }
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
        ArnLike = {
          "aws:SourceArn" = "arn:${data.aws_partition.current.partition}:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
        }
      }
    }]
  })

  tags = var.tags
}

# S3 access
resource "aws_iam_policy" "s3_access" {
  name = "${var.role_name}-s3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Resource = [
        var.s3_bucket_arn,
        "${var.s3_bucket_arn}/*"
      ]
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.knowledge_base.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# OpenSearch Serverless access
resource "aws_iam_policy" "aoss_access" {
  name = "${var.role_name}-aoss"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "aoss:APIAccessAll"
      ]
      Resource = [var.opensearch_collection_arn]
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "aoss_access" {
  role       = aws_iam_role.knowledge_base.name
  policy_arn = aws_iam_policy.aoss_access.arn
}

# Bedrock model access
resource "aws_iam_policy" "bedrock_access" {
  name = "${var.role_name}-bedrock"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = [
        "arn:${data.aws_partition.current.partition}:bedrock:${data.aws_region.current.name}::foundation-model/${var.embedding_model_id}"
      ]
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "bedrock_access" {
  role       = aws_iam_role.knowledge_base.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}
