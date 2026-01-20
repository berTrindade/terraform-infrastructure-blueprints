# modules/data/main.tf
# DynamoDB table

resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # GSI for user-based queries
  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = var.tags
}
