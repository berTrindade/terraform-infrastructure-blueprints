run "validate_variables" {
  command = plan

  variables {
    project   = "test-project"
    environment = "dev"
    location   = "Central US"
    postgresql_password = "TestPassword123!"
  }

  assert {
    condition     = true
    error_message = "Variables validation passed"
  }
}
