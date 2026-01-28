# Run All Tests and Fix Failures

## Overview

Execute the full test suite and systematically fix any failures, ensuring code quality and functionality.

## Steps

### 1. Run Pre-commit Checks

```bash
pre-commit run --all-files
```

- [ ] Terraform formatting (`terraform fmt`)
- [ ] Terraform validation (`terraform validate`)
- [ ] TFLint checks (`tflint`)
- [ ] Documentation generation (`terraform-docs`)

### 2. Run Terraform Tests

For each affected blueprint:

```bash
cd aws/{blueprint-name}/environments/dev
terraform init
terraform test
```

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Blueprint tests pass

### 3. Analyze Failures

- [ ] Categorize by type: formatting, validation, linting, test failures
- [ ] Prioritize fixes based on impact
- [ ] Check if failures are related to recent changes
- [ ] Review error messages carefully

### 4. Fix Issues Systematically

**Formatting Issues:**

```bash
terraform fmt -recursive
```

**Validation Errors:**

- Check variable types and values
- Verify module sources and versions
- Check resource dependencies

**Linting Warnings:**

- Address HIGH and CRITICAL issues
- Document acceptable warnings

**Test Failures:**

- Review test expectations
- Check resource configurations
- Verify test setup

### 5. Re-run Tests

- [ ] Fix one issue at a time
- [ ] Re-run tests after each fix
- [ ] Verify all tests pass
- [ ] Run full suite one final time

### 6. Security Scans

- [ ] Run Trivy: `trivy config .`
- [ ] Run Checkov: `checkov -d .`
- [ ] Address HIGH and CRITICAL findings

## Test Types

- **Pre-commit hooks**: Formatting, validation, linting
- **Terraform tests**: Unit and integration tests
- **Security scans**: Trivy and Checkov

## Example Usage

```
/run-all-tests-and-fix Run all tests and fix any failures in apigw-lambda-rds
```

## Checklist

- [ ] Pre-commit checks pass
- [ ] Terraform tests pass
- [ ] Security scans pass
- [ ] All failures fixed
- [ ] Final test run successful
