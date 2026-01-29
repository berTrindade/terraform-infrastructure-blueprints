# Testing Guide

Blueprints include native Terraform tests (`.tftest.hcl`) for validation.

## Running Tests

```bash
# Navigate to the blueprint's environment
cd aws/apigw-lambda-dynamodb/environments/dev

# Initialize Terraform
terraform init

# Run all tests
terraform test

# Run tests with verbose output
terraform test -verbose
```

## What Tests Validate

| Category | Examples |
|----------|----------|
| **Input validation** | Project name format, environment constraints |
| **Configuration** | API routes, memory limits, timeouts |
| **Resource creation** | VPC, Lambda, DynamoDB modules planned |
| **Defaults** | Billing mode, log retention, scaling |

## Test Structure

```
aws/{blueprint-name}/
├── environments/
│   └── dev/
│       └── *.tf
└── tests/
    └── blueprint.tftest.hcl   # Native Terraform tests
```

## Example Test

```hcl
# tests/blueprint.tftest.hcl
run "validate_project_name" {
  command = plan

  variables {
    project     = "my-api"
    environment = "dev"
  }

  assert {
    condition     = true
    error_message = "Project name validation failed"
  }
}
```

## Test Coverage Requirements

Before submitting a PR, ensure:

- `terraform fmt -check` passes
- `terraform validate` passes
- `tflint` passes (or warnings are documented)
- `terraform test` passes
- Manual `terraform plan` review shows expected changes
- Security scans pass (Trivy, Checkov)
