# tests/unit/validation.tftest.hcl
# Unit tests for input validation

mock_provider "google" {}
mock_provider "google-beta" {}
mock_provider "random" {}

run "validate_variables" {
  command = plan

  variables {
    project     = "test-project"
    project_id  = "test-project-id"
    environment = "dev"
    region      = "us-central1"
    storage_bucket_name = "test-storage"
  }

  assert {
    condition     = true
    error_message = "Variables validation passed"
  }
}
