# modules/compute/main.tf
# App Engine application (minimal - actual app deployment is done via gcloud/app.yaml)

# Enable App Engine API
resource "google_project_service" "appengine" {
  project = var.project_id
  service = "appengine.googleapis.com"

  disable_on_destroy = false
}

# Create App Engine application
resource "google_app_engine_application" "this" {
  project     = var.project_id
  location_id = var.location_id

  depends_on = [google_project_service.appengine]
}
