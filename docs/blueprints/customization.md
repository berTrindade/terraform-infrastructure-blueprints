# Customization Guide

Common customizations, quick reference commands, and important constraints.

## Common Customizations

| Customization | Where to Change | Example |
|---------------|-----------------|---------|
| AWS Region | `terraform.tfvars` | `aws_region = "eu-west-1"` |
| Project Name | `terraform.tfvars` | `project = "client-api"` |
| Database Size | `terraform.tfvars` | `db_instance_class = "db.t3.medium"` |
| Lambda Memory | `terraform.tfvars` | `lambda_memory_size = 512` |
| VPC CIDR | `modules/vpc/variables.tf` | `cidr_block = "10.1.0.0/16"` |
| Tags | `modules/tagging/main.tf` | Add custom tags |

## Quick Reference Commands

```bash
# Download a blueprint (use your preferred method - git clone, GitHub CLI, etc.)
git clone https://github.com/berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/aws/{blueprint-name}

# Initialize and deploy
cd environments/dev
terraform init
terraform plan
terraform apply

# Get outputs (API endpoint, etc.)
terraform output

# Run tests
terraform test

# Cleanup
terraform destroy
```

## Important Constraints

1. **Client ownership**: Generated code must be fully standalone
2. **No ustwo dependencies**: Zero references to ustwo repos or packages
3. **Self-contained modules**: All modules included in the blueprint folder
4. **Official AWS modules**: Use terraform-aws-modules where appropriate
5. **Terraform 1.11+**: Required for ephemeral values and write-only attributes
