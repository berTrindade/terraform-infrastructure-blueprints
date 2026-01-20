# modules/vector/main.tf
# OpenSearch Serverless for vector storage

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Encryption policy (required for AOSS)
resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.collection_name}-enc"
  type = "encryption"

  policy = jsonencode({
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${var.collection_name}"]
    }]
    AWSOwnedKey = true
  })
}

# Network policy
resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.collection_name}-net"
  type = "network"

  policy = jsonencode([{
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${var.collection_name}"]
    }, {
      ResourceType = "dashboard"
      Resource     = ["collection/${var.collection_name}"]
    }]
    AllowFromPublic = true
  }])
}

# Data access policy
resource "aws_opensearchserverless_access_policy" "data" {
  name = "${var.collection_name}-data"
  type = "data"

  policy = jsonencode([{
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${var.collection_name}"]
      Permission   = [
        "aoss:CreateCollectionItems",
        "aoss:DeleteCollectionItems",
        "aoss:UpdateCollectionItems",
        "aoss:DescribeCollectionItems"
      ]
    }, {
      ResourceType = "index"
      Resource     = ["index/${var.collection_name}/*"]
      Permission   = [
        "aoss:CreateIndex",
        "aoss:DeleteIndex",
        "aoss:UpdateIndex",
        "aoss:DescribeIndex",
        "aoss:ReadDocument",
        "aoss:WriteDocument"
      ]
    }]
    Principal = concat(
      [data.aws_caller_identity.current.arn],
      var.additional_principals
    )
  }])
}

# OpenSearch Serverless Collection (Vector type)
resource "aws_opensearchserverless_collection" "this" {
  name        = var.collection_name
  description = "Vector store for Bedrock Knowledge Base"
  type        = "VECTORSEARCH"

  standby_replicas = var.standby_replicas

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
    aws_opensearchserverless_access_policy.data,
  ]

  tags = var.tags
}
