# modules/data/main.tf
# DynamoDB table for command storage
# Based on terraform-skill security-compliance patterns

resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  # Primary key
  attribute {
    name = "id"
    type = "S"
  }

  # Enable encryption at rest (AWS managed key)
  server_side_encryption {
    enabled = true
  }

  # Point-in-time recovery for production resilience
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # TTL for automatic cleanup (optional)
  dynamic "ttl" {
    for_each = var.ttl_attribute_name != null ? [1] : []
    content {
      attribute_name = var.ttl_attribute_name
      enabled        = true
    }
  }

  tags = var.tags
}
