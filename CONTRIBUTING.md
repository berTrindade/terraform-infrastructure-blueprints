# Contributing Guidelines

Thank you for considering contributing to Terraform Infrastructure Blueprints! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style & Standards](#code-style--standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Review Process](#review-process)
- [Code Quality](#code-quality)
- [Security Considerations](#security-considerations)
- [Contact](#contact)

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. Check if the issue already exists in the [GitHub Issues](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues)
2. Use a clear, descriptive title
3. Provide detailed information:
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Affected blueprint(s)
   - Terraform and provider versions
   - Relevant error messages or logs

### Suggesting Features

Feature suggestions are welcome! Please include:

- Clear description of the feature
- Use case or problem it solves
- Proposed blueprint or pattern
- Any relevant examples or references

### Submitting Changes

1. **Fork the repository** and clone your fork locally
2. **Create a new branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes** following our code style and standards
4. **Test your changes** locally (see [Testing Requirements](#testing-requirements))
5. **Commit your changes** using conventional commits (see [Code Style](#code-style--standards))
6. **Push to your fork** and open a pull request

## Development Setup

### Prerequisites

- Terraform >= 1.9.0
- AWS CLI configured (for testing)
- Git
- Pre-commit hooks (recommended)

### Pre-commit Hooks

This repository uses [pre-commit](https://pre-commit.com/) to enforce code quality standards. Install and configure:

```bash
# Install pre-commit (macOS)
brew install pre-commit tflint terraform-docs

# Install pre-commit (pip)
pip install pre-commit

# Install the git hooks
pre-commit install
```

The hooks will automatically:

- Format Terraform files (`terraform fmt`)
- Validate Terraform configuration (`terraform validate`)
- Lint Terraform files (`tflint`)
- Generate documentation (`terraform-docs`)

Run manually on all files:

```bash
pre-commit run --all-files
```

## Code Style & Standards

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(apigw-lambda-rds): add RDS Proxy support
fix(alb-ecs-fargate): correct security group rules
docs(readme): update quick start guide
```

### Terraform Code Style

- **Formatting**: Always run `terraform fmt -recursive` before committing
- **Naming**: Use `snake_case` for variables, resources, and modules
- **Structure**: Follow the blueprint structure pattern:

  ```
  blueprint-name/
  ├── environments/
  │   └── dev/
  │       ├── main.tf
  │       ├── variables.tf
  │       ├── outputs.tf
  │       ├── versions.tf
  │       └── terraform.tfvars
  ├── modules/
  ├── src/
  ├── tests/
  └── README.md
  ```

- **Variables**: Always include descriptions:

  ```hcl
  variable "project" {
    description = "Project name used for resource naming"
    type        = string
  }
  ```

- **Outputs**: Always include descriptions:

  ```hcl
  output "api_endpoint" {
    description = "API Gateway endpoint URL"
    value       = module.api.endpoint
  }
  ```

- **Modules**: Keep modules focused and self-contained
- **Comments**: Add comments for complex logic or non-obvious decisions

### Self-Contained Principle

**Critical**: All blueprints must be self-contained:

- ✅ Include all modules within the blueprint folder
- ✅ No references to shared modules or external dependencies
- ✅ No ustwo-specific references or secrets
- ✅ All code must work independently after copying

## Testing Requirements

### Running Tests

Each blueprint includes Terraform tests (`.tftest.hcl`). See [Testing Guide](docs/guides/testing.md) for detailed instructions:

```bash
cd aws/apigw-lambda-dynamodb/environments/dev
terraform init
terraform test
```

### Test Coverage

Before submitting a PR, ensure:

- ✅ `terraform fmt -check` passes
- ✅ `terraform validate` passes
- ✅ `tflint` passes (or warnings are documented)
- ✅ `terraform test` passes
- ✅ Manual `terraform plan` review shows expected changes
- ✅ Security scans pass (Trivy, Checkov)

### Testing New Blueprints

For new blueprints, include:

- **Unit tests**: Validate input variables and module structure
- **Integration tests**: Verify resource creation (if possible in CI)
- **Documentation**: Clear examples and usage instructions

## Documentation Standards

### README Requirements

Every blueprint must include:

- **Architecture**: Diagram or description of the infrastructure
- **Quick Start**: Step-by-step deployment guide
- **Estimated Costs**: Rough cost estimate for resources
- **Cleanup**: Instructions for destroying resources
- **Variables**: Key variables explained
- **Outputs**: Important outputs documented

### Code Documentation

- **Variable descriptions**: Required for all variables
- **Output descriptions**: Required for all outputs
- **Module README**: Include README.md in complex modules
- **Inline comments**: Explain complex logic or non-obvious decisions

### ADRs

For significant architectural decisions:

- Create an ADR in `docs/adr/`
- Follow the ADR template (see [Architecture Decision Records](docs/adr/README.md))
- Update the ADR index in the main README

## Pull Request Process

### PR Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] PR description includes:
  - What changed and why
  - Related issues (if any)
  - Testing performed
  - Breaking changes (if any)

### PR Template

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`) which includes:

- Description of changes
- Type of change (bug fix, feature, etc.)
- Blueprints affected
- Code quality checklist
- Security checklist
- Documentation checklist
- Testing checklist

## Review Process

### What Reviewers Look For

- **Code quality**: Readability, maintainability, best practices
- **Self-contained**: No external dependencies or ustwo references
- **Security**: Least-privilege IAM, no secrets in code
- **Documentation**: Clear and comprehensive
- **Testing**: Adequate test coverage
- **Consistency**: Follows blueprint patterns

### Review Timeline

- Initial review: Within 2-3 business days
- Follow-up reviews: Within 1-2 business days
- For urgent fixes: Contact maintainer directly

### Responding to Feedback

- Address all review comments
- Ask questions if feedback is unclear
- Update PR description if significant changes made
- Re-request review after addressing feedback

## Code Quality

### Principles

Follow the engineering playbook principles:

- **Modularity**: Break systems into focused modules
- **Readability**: Write clear, well-named code
- **Testing**: Catch bugs early with comprehensive tests
- **Documentation**: Document designs and decisions clearly
- **Security**: Build security in from the start

### Quality Checks

All code must pass:

- Terraform formatting (`terraform fmt`)
- Terraform validation (`terraform validate`)
- TFLint checks (`tflint`)
- Security scans (Trivy, Checkov)
- Pre-commit hooks

## Security Considerations

### Secrets Management

- ❌ **Never commit secrets** (passwords, API keys, etc.)
- ✅ Use ephemeral secrets for database passwords (Flow A)
- ✅ Use Secrets Manager for third-party API keys (Flow B)
- ✅ Follow the [Secrets Management](README.md#secrets-management) patterns

### IAM Policies

- Follow least-privilege principle
- Use specific resource ARNs, not wildcards
- Document IAM permissions in module READMEs

### Security Scanning

All blueprints are scanned for:

- Misconfigurations (Trivy)
- Policy violations (Checkov)
- Vulnerabilities in dependencies

Address HIGH and CRITICAL findings before merging.

## Additional Guides

- **[Deployment Guide](docs/guides/deployment.md)** - Detailed step-by-step deployment instructions
- **[Environment Creation](docs/guides/environments.md)** - Creating staging and production environments
- **[Testing Guide](docs/guides/testing.md)** - Running and writing Terraform tests
- **[CI/CD Pipeline](docs/guides/cicd.md)** - Setting up CI/CD workflows

## Contact

For questions or clarifications:

- **Maintainer**: Bernardo Trindade de Abreu
- **Email**: <bernardo.trindade-de-abreu@ustwo.com>
- **GitHub Issues**: [Open an issue](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues)
- **Pull Requests**: [Submit a PR](https://github.com/berTrindade/terraform-infrastructure-blueprints/pulls)

Thank you for contributing! 🎉
