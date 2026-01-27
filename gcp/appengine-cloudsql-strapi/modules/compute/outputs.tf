output "app_id" {
  description = "App Engine application ID"
  value       = google_app_engine_application.this.id
}

output "default_hostname" {
  description = "Default hostname for the App Engine application"
  value       = google_app_engine_application.this.default_hostname
}
