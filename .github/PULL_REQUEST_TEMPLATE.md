## Description

<!-- Describe your changes in detail -->

## Related Issue

<!-- Link to the issue this PR addresses -->
Fixes #

## Type of Change

<!-- Mark the appropriate option with an [x] -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] New blueprint (complete new infrastructure pattern)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] CI/CD improvement
- [ ] Refactoring (no functional changes)

## Blueprint(s) Affected

<!-- List the blueprints this PR modifies -->

- [ ] `example-sqs-worker-api`
- [ ] `example-serverless-api-*`
- [ ] `example-ecs-*`
- [ ] `example-eks-*`
- [ ] Other: 

## Checklist

### Code Quality

- [ ] My code follows the project's coding standards
- [ ] I have run `terraform fmt -recursive` on my changes
- [ ] I have run `terraform validate` successfully
- [ ] TFLint passes without errors
- [ ] I have added/updated tests as appropriate

### Security

- [ ] Trivy scan passes (no HIGH/CRITICAL findings)
- [ ] Checkov scan passes (or findings are documented in `.checkov.yaml`)
- [ ] No secrets or credentials are committed
- [ ] IAM policies follow least privilege principle

### Documentation

- [ ] I have updated the README if needed
- [ ] I have added/updated inline comments for complex logic
- [ ] Variable descriptions are clear and complete
- [ ] Output descriptions are clear and complete

### Testing

- [ ] Unit tests pass (`terraform test -filter=tests/unit/`)
- [ ] I have tested `terraform plan` locally
- [ ] I have tested `terraform apply` in a dev environment (if applicable)
- [ ] I have tested `terraform destroy` to ensure clean teardown

### Breaking Changes

<!-- If this is a breaking change, describe the migration path -->

- [ ] This PR includes breaking changes
- [ ] Migration guide is included in the description

## Screenshots / Terraform Plan Output

<!-- If applicable, add screenshots or terraform plan output -->

<details>
<summary>Terraform Plan</summary>

```
# Paste terraform plan output here
```

</details>

## Additional Notes

<!-- Any additional information that reviewers should know -->
