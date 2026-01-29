---
name: validate-blueprint
description: Validate a blueprint structure and quality against repository standards. Use when validating blueprints, checking quality, or before submitting PRs.
---

# Validate Blueprint

## Overview

This skill validates that a blueprint follows the required structure, quality standards, and security best practices. Use this before submitting pull requests or when checking blueprint quality.

## When to Use

- Before submitting a PR with blueprint changes
- When validating blueprint structure and quality
- When checking if a blueprint meets repository standards
- When reviewing blueprint compliance

## Instructions

### Step 1: Run Validation Script

The primary validation is done via the validation script:

```bash
./scripts/validate-blueprint.sh {blueprint-path}
```

**Examples:**
```bash
# Validate a specific blueprint
./scripts/validate-blueprint.sh aws/apigw-lambda-dynamodb

# Validate all blueprints
./scripts/validate-blueprint.sh --all
```

### Step 2: Review Validation Results

The script checks the following areas:

#### Structure Validation
- ✅ `environments/dev/` directory exists
- ✅ `modules/` directory exists with at least one module
- ✅ Required files in `environments/dev/`:
  - `main.tf`
  - `variables.tf`
  - `outputs.tf`
  - `versions.tf`
  - `terraform.tfvars`
- ✅ `backend.tf.example` exists (recommended)
- ✅ `scripts/create-environment.sh` exists and is executable
- ✅ `.github/workflows/deploy.yml` exists
- ✅ `README.md` exists

#### README Validation
- ✅ Required sections present:
  - **Architecture**
  - **Quick Start**
  - **Estimated Costs**
  - **Cleanup**
- ✅ Architecture diagram (Mermaid recommended)
- ✅ curl examples (for API blueprints)

#### Terraform Validation
- ✅ Terraform formatting is correct (`terraform fmt -check`)
- ✅ Terraform configuration is valid (`terraform validate`)
  - Note: Requires `terraform init` first

#### terraform.tfvars Validation
- ✅ `project` variable is set
- ✅ `environment` variable is set
- ✅ `aws_region` (or equivalent) variable is set
- ✅ Default region is `eu-west-2` (or appropriate default)

#### Security Validation
- ✅ No hardcoded secrets (passwords, API keys, AWS access keys)
- ✅ No public database access unless intended
- ✅ No open security groups (0.0.0.0/0) unless intended

### Step 3: Fix Issues

If validation fails, address each issue:

1. **Structure issues**: Create missing directories/files
2. **README issues**: Add missing sections
3. **Terraform formatting**: Run `terraform fmt -recursive`
4. **Terraform validation**: Fix syntax errors, run `terraform init` if needed
5. **tfvars issues**: Add missing required variables
6. **Security issues**: Remove hardcoded secrets, review public access

### Step 4: Re-run Validation

After fixing issues, re-run the validation script to confirm all checks pass:

```bash
./scripts/validate-blueprint.sh {blueprint-path}
```

## Validation Checklist

### Structure
- [ ] `environments/dev/` directory exists
- [ ] `modules/` directory exists with modules
- [ ] All required files in `environments/dev/`
- [ ] `backend.tf.example` exists
- [ ] `scripts/create-environment.sh` exists and is executable
- [ ] `.github/workflows/deploy.yml` exists
- [ ] `README.md` exists

### README
- [ ] Architecture section present
- [ ] Quick Start section present
- [ ] Estimated Costs section present
- [ ] Cleanup section present
- [ ] Architecture diagram included (recommended)
- [ ] curl examples included (for APIs)

### Terraform
- [ ] `terraform fmt -check` passes
- [ ] `terraform validate` passes (after init)
- [ ] All variables have descriptions
- [ ] All outputs have descriptions

### terraform.tfvars
- [ ] `project` variable set
- [ ] `environment` variable set
- [ ] `aws_region` (or equivalent) variable set
- [ ] Default region is appropriate

### Security
- [ ] No hardcoded secrets
- [ ] No unintended public access
- [ ] Security groups reviewed

## Manual Validation Steps

In addition to the script, manually verify:

1. **Self-contained principle**: No external module dependencies
2. **No ustwo references**: No ustwo-specific code or secrets
3. **Documentation quality**: README is clear and comprehensive
4. **Test coverage**: Tests exist and pass
5. **Code style**: Follows repository conventions

## Exit Codes

The validation script returns:
- `0` - All validations passed (may have warnings)
- `1` - Validation failed (one or more failures)

## References

- [validate-blueprint.sh](../scripts/validate-blueprint.sh) - Validation script source
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Quality standards and requirements
- [Blueprint Structure](../README.md#blueprint-structure) - Expected structure
