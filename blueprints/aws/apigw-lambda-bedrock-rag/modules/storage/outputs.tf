# modules/storage/outputs.tf

output "bucket_id" {
  value = aws_s3_bucket.documents.id
}

output "bucket_arn" {
  value = aws_s3_bucket.documents.arn
}

output "bucket_name" {
  value = aws_s3_bucket.documents.bucket
}

output "bucket_domain_name" {
  value = aws_s3_bucket.documents.bucket_domain_name
}
