# Onboard New Developer

## Overview
Comprehensive onboarding process to get a new developer up and running quickly with the Terraform Infrastructure Blueprints project.

## Steps

### 1. Environment Setup

**Prerequisites:**
- [ ] Install Terraform >= 1.9.0
- [ ] Install AWS CLI and configure credentials
- [ ] Install Git
- [ ] Install pre-commit hooks

**Install Pre-commit:**
```bash
# macOS
brew install pre-commit tflint terraform-docs

# or pip
pip install pre-commit

# Install git hooks
pre-commit install
```

**Verify Setup:**
```bash
terraform version
aws --version
pre-commit --version
```

### 2. Repository Setup
- [ ] Clone the repository
- [ ] Read README.md
- [ ] Review CONTRIBUTING.md
- [ ] Understand project structure
- [ ] Review blueprint examples

### 3. Project Familiarization

**Key Documents:**
- [ ] Read [README.md](README.md) - Project overview
- [ ] Read [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [ ] Read [docs/ai-assistant-guidelines.md](docs/ai-assistant-guidelines.md) - AI assistant patterns
- [ ] Review [docs/blueprints/catalog.md](docs/blueprints/catalog.md) - Blueprint catalog

**Key Concepts:**
- [ ] Understand self-contained blueprint principle
- [ ] Learn ephemeral password pattern (Flow A)
- [ ] Understand IAM Database Authentication
- [ ] Learn VPC endpoints vs NAT Gateway
- [ ] Review blueprint structure pattern

### 4. Run Example Blueprint
```bash
cd aws/apigw-lambda-dynamodb/environments/dev
terraform init
terraform plan
```

- [ ] Successfully initialize Terraform
- [ ] Review plan output
- [ ] Understand module structure
- [ ] Review variables and outputs

### 5. Run Tests
```bash
terraform test
```

- [ ] Tests run successfully
- [ ] Understand test structure
- [ ] Review test files

### 6. Development Workflow
- [ ] Understand branch naming (feature/, fix/)
- [ ] Learn conventional commits format
- [ ] Practice running pre-commit hooks
- [ ] Understand PR process
- [ ] Review code review checklist

### 7. First Contribution
- [ ] Pick a small issue or feature
- [ ] Create feature branch
- [ ] Make changes following patterns
- [ ] Write/update tests
- [ ] Update documentation
- [ ] Create PR

## Onboarding Checklist
- [ ] Development environment ready
- [ ] All tools installed and configured
- [ ] Repository cloned and understood
- [ ] Key documents read
- [ ] Example blueprint reviewed
- [ ] Tests run successfully
- [ ] First PR submitted

## Resources
- **Documentation**: `docs/` directory
- **Blueprints**: `aws/`, `azure/`, `gcp/` directories
- **Testing Guide**: `docs/guides/testing.md`
- **Deployment Guide**: `docs/guides/deployment.md`

## Example Usage
```
/onboard-new-developer Help onboard a new team member
```
