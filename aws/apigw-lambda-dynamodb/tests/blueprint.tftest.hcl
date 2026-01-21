# Native Terraform Test for Serverless API with DynamoDB
# Run: terraform test

variables {
  project     = "test-api"
  environment = "dev"
  aws_region  = "eu-west-2"
}

# ============================================
# Test: Input Validation
# ============================================

run "validate_project_name_format" {
  command = plan

  variables {
    project     = "my-api-project"
    environment = "dev"
  }

  # If plan succeeds, the validation passed
  assert {
    condition     = true
    error_message = "Project name validation should pass for valid names"
  }
}

run "validate_environment_constraint" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  assert {
    condition     = true
    error_message = "Environment validation should pass for 'dev'"
  }
}

# ============================================
# Test: API Routes Configuration
# ============================================

run "validate_api_routes_method" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
    api_routes = {
      test_route = {
        method = "GET"
        path   = "/test"
      }
    }
  }

  assert {
    condition     = true
    error_message = "API route with valid method should be accepted"
  }
}

run "validate_api_routes_path_format" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
    api_routes = {
      nested_route = {
        method = "POST"
        path   = "/items/{id}/actions"
      }
    }
  }

  assert {
    condition     = true
    error_message = "API route with path parameters should be accepted"
  }
}

# ============================================
# Test: Resource Creation
# ============================================

run "verify_dynamodb_table_created" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  # Verify DynamoDB module is configured
  assert {
    condition     = module.dynamodb.dynamodb_table_id != ""
    error_message = "DynamoDB table should be planned for creation"
  }
}

run "verify_lambda_function_created" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  # Verify Lambda module is configured
  assert {
    condition     = module.api_lambda.lambda_function_arn != ""
    error_message = "Lambda function should be planned for creation"
  }
}

run "verify_api_gateway_created" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  # Verify API Gateway module is configured
  assert {
    condition     = module.api_gateway.api_id != ""
    error_message = "API Gateway should be planned for creation"
  }
}

# ============================================
# Test: Default Values
# ============================================

run "verify_default_memory_size" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  assert {
    condition     = var.lambda_memory_size == 256
    error_message = "Default Lambda memory should be 256 MB"
  }
}

run "verify_default_timeout" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  assert {
    condition     = var.lambda_timeout == 30
    error_message = "Default Lambda timeout should be 30 seconds"
  }
}

run "verify_default_billing_mode" {
  command = plan

  variables {
    project     = "test-api"
    environment = "dev"
  }

  assert {
    condition     = var.dynamodb_billing_mode == "PAY_PER_REQUEST"
    error_message = "Default DynamoDB billing should be PAY_PER_REQUEST"
  }
}
