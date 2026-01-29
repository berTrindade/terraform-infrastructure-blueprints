---
name: create-blueprint
description: Scaffold a new infrastructure blueprint following repository standards. Use when creating a new blueprint or when the user mentions new blueprint, new infrastructure pattern, or adding a new cloud pattern.
---

# Create Blueprint

## Overview

This skill guides the creation of a new infrastructure blueprint that follows the repository's structure, standards, and self-contained principles. Blueprints must be completely standalone with zero external dependencies.

## When to Use

- User wants to create a new blueprint
- User mentions "new blueprint", "new infrastructure pattern", or "adding a new cloud pattern"
- User needs to scaffold infrastructure for a new architecture pattern
- User wants to add a blueprint for a different cloud provider

## Instructions

### Step 1: Gather Blueprint Details

Before creating the blueprint, gather the following information:

1. **Blueprint name**: Use kebab-case (e.g., `apigw-lambda-dynamodb`)
2. **Cloud provider**: `aws`, `azure`, or `gcp`
3. **Architecture pattern**: Serverless, containers, event-driven, etc.
4. **Key components**: API Gateway, Lambda, RDS, DynamoDB, etc.

### Step 2: Create Directory Structure

Create the following directory structure under `{cloud}/{blueprint-name}/`:

```
{cloud}/{blueprint-name}/
├── environments/
│   └── dev/
│       ├── main.tf           # Module composition
│       ├── variables.tf      # Input variables
│       ├── outputs.tf        # Output values
│       ├── versions.tf       # Provider versions
│       ├── terraform.tfvars  # Configuration values
│       └── backend.tf.example # Backend configuration template
├── modules/                  # Self-contained modules
│   ├── api/                  # API Gateway/Lambda/AppSync (if applicable)
│   ├── compute/              # Lambda functions or ECS services
│   ├── data/                 # Database (DynamoDB, RDS, Aurora, etc.)
│   ├── networking/           # VPC, subnets, security groups (if needed)
│   ├── naming/               # Naming conventions
│   └── tagging/              # Resource tagging
├── scripts/
│   └── create-environment.sh # Helper script for creating environments
├── tests/
│   ├── unit/
│   │   └── validation.tftest.hcl
│   └── integration/
│       └── full.tftest.hcl
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD workflow
└── README.md                 # Blueprint-specific documentation
```

### Step 3: Initialize with Boilerplate Code

Follow patterns from existing blueprints. Key requirements:

#### `environments/dev/main.tf`
- Compose modules from `modules/` directory
- Follow naming conventions
- Include proper tagging

#### `environments/dev/variables.tf`
- Include required variables: `project`, `environment`, `aws_region` (or equivalent)
- All variables must have descriptions
- Use appropriate types

#### `environments/dev/outputs.tf`
- Include key outputs (endpoints, resource IDs, etc.)
- All outputs must have descriptions

#### `environments/dev/versions.tf`
- Specify Terraform version (>= 1.9.0)
- Specify provider versions

#### `environments/dev/terraform.tfvars`
- Set default values:
  - `project = "example-project"`
  - `environment = "dev"`
  - `aws_region = "eu-west-2"` (or appropriate default for cloud provider)

#### `environments/dev/backend.tf.example`
- Provide example backend configuration
- Use S3 backend for AWS, appropriate backend for other clouds

#### `modules/`
- Create self-contained modules (no external dependencies)
- Each module should have its own `main.tf`, `variables.tf`, `outputs.tf`
- Follow the module structure from existing blueprints

#### `scripts/create-environment.sh`
- Make executable (`chmod +x`)
- Script to create new environments (staging, production)

#### `tests/`
- Unit tests: Validate input variables and module structure
- Integration tests: Verify resource creation (if possible in CI)

#### `.github/workflows/deploy.yml`
- CI/CD workflow for automated deployment
- Follow patterns from existing blueprints

#### `README.md`
Must include these required sections:

1. **Architecture**: Diagram (Mermaid recommended) or description
2. **Quick Start**: Step-by-step deployment guide with:
   - Prerequisites
   - Configuration steps
   - Deployment commands
   - Test commands (curl examples for APIs)
3. **Estimated Costs**: Rough cost estimate for resources
4. **Cleanup**: Instructions for destroying resources
5. **Variables**: Key variables explained
6. **Outputs**: Important outputs documented

### Step 4: Follow Self-Contained Principle

**Critical**: All blueprints must be self-contained:

- ✅ Include all modules within the blueprint folder
- ✅ No references to shared modules or external dependencies
- ✅ No ustwo-specific references or secrets
- ✅ All code must work independently after copying

### Step 5: Reference Documentation

When creating the blueprint, reference:

- **[CONTRIBUTING.md](../CONTRIBUTING.md)**: Structure requirements, code style, testing
- **[Blueprint Catalog](../docs/blueprints/catalog.md)**: Existing patterns and structure
- **[Blueprint Structure](../README.md#blueprint-structure)**: Standard structure
- **Existing blueprints**: Use similar patterns as reference (e.g., `aws/apigw-lambda-dynamodb`)

### Step 6: Validate the Blueprint

After creation, run the validation script:

```bash
./scripts/validate-blueprint.sh {cloud}/{blueprint-name}
```

This will check:
- Directory structure
- Required files
- README sections
- Terraform formatting
- Security (no hardcoded secrets)
- terraform.tfvars requirements

## Checklist

- [ ] Directory structure created
- [ ] All required files initialized with boilerplate
- [ ] `terraform.tfvars` includes `project`, `environment`, and region variables
- [ ] All variables and outputs have descriptions
- [ ] README.md includes all required sections (Architecture, Quick Start, Estimated Costs, Cleanup)
- [ ] Modules are self-contained (no external dependencies)
- [ ] Scripts are executable
- [ ] Tests are included (unit and integration)
- [ ] CI/CD workflow is configured
- [ ] Validation script passes
- [ ] No hardcoded secrets
- [ ] Follows naming conventions (snake_case for Terraform, kebab-case for directories)

## References

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Main contribution guidelines
- [Blueprint Catalog](../docs/blueprints/catalog.md) - Existing blueprints and patterns
- [Blueprint Structure](../README.md#blueprint-structure) - Standard structure documentation
- [validate-blueprint.sh](../scripts/validate-blueprint.sh) - Validation script
