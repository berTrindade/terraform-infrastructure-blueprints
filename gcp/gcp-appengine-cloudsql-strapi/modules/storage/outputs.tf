output "bucket_name" {
  description = "Name of the Cloud Storage bucket"
  value       = google_storage_bucket.this.name
}

output "bucket_url" {
  description = "URL of the Cloud Storage bucket"
  value       = google_storage_bucket.this.url
}

output "service_account_email" {
  description = "Email of the storage service account"
  value       = google_service_account.storage.email
}

output "service_account_id" {
  description = "ID of the storage service account"
  value       = google_service_account.storage.id
}
