---
name: terraform-practices
description: Use when writing or reviewing Terraform/OpenTofu; setting up tests or CI/CD; choosing testing approach; structuring modules; or applying block ordering, count/for_each, and modern features. Covers testing (native/Terratest), CI/CD, code structure, and module patterns for blueprint-based or blueprint-style Terraform.
---

# Infrastructure Terraform Practices

**Overview.** This skill covers testing, CI/CD, code structure, and module patterns for Terraform and OpenTofu—including code generated from or styled like the blueprints in this repo.

**When to use**
- Writing or reviewing Terraform/OpenTofu (including blueprint-generated code)
- Setting up tests (native test framework, Terratest) or CI/CD
- Choosing testing approach (static vs native vs Terratest vs policy vs mock)
- Structuring modules; block ordering; count vs for_each; locals for dependency order
- Version management and modern Terraform features (try, optional, moved, write-only)

**When not to use**
- Blueprint selection or catalog → use `style-guide`
- Secrets (ephemeral passwords, IAM DB auth) or security group rules → use `security`

---

## 1. Testing

### Decision matrix

| Situation | Approach | Tools | Cost |
|-----------|----------|-------|------|
| Quick syntax check | Static analysis | `terraform validate`, `fmt` | Free |
| Pre-commit validation | Static + lint | `validate`, `tflint`, `trivy`, `checkov` | Free |
| Terraform 1.6+, simple logic | Native test framework | `terraform test` | Free–Low |
| Pre-1.6, or Go expertise | Integration testing | Terratest | Low–Med |
| Security/compliance focus | Policy as code | OPA, Sentinel | Free |
| Cost-sensitive workflow | Mock providers (1.7+) | Native tests + mocking | Free |

### Testing pyramid

- **Static** (cheap): validate, fmt, lint, security scanning
- **Integration**: module tests, real resources in test account
- **E2E** (expensive): full environment deployment

### Native test tips

- **command = plan** — fast; input validation, input-derived attributes
- **command = apply** — computed values, set-type blocks, real/mocked behavior
- For set-type blocks use `for` expressions or `command = apply`; do not index with `[0]`

**Detail:** [references/testing-frameworks.md](references/testing-frameworks.md)


---

## 2. Code structure

### Resource block order

1. `count` or `for_each` first (blank line after)
2. Other arguments
3. `tags` as last real argument
4. `depends_on` (if needed)
5. `lifecycle` at end (if needed)

### Variable block order

1. `description` (always)
2. `type`
3. `default`
4. `validation`
5. `nullable` (when false)

```hcl
# GOOD
resource "aws_nat_gateway" "this" {
  count = var.create_nat_gateway ? 1 : 0

  allocation_id = aws_eip.this[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = { Name = "${var.name}-nat" }

  depends_on = [aws_internet_gateway.this]
}
```

**Detail:** [references/code-patterns.md](references/code-patterns.md)

---

## 3. Count vs for_each

| Scenario | Use | Why |
|----------|-----|-----|
| Boolean (create or don't) | `count = condition ? 1 : 0` | Simple toggle |
| Stable addressing; items may be reordered/removed | `for_each = toset(list)` | Avoid index shift |
| Reference by key | `for_each = map` | Named access |

**Stable addressing (AZs):** Prefer `for_each = toset(var.availability_zones)` so removing one AZ only affects that resource.

**Detail:** [references/code-patterns.md](references/code-patterns.md)

---

## 4. Locals for dependency management

Use `try()` in locals to hint deletion order (e.g. subnets before secondary CIDR):

```hcl
locals {
  vpc_id = try(
    aws_vpc_ipv4_cidr_block_association.this[0].vpc_id,
    aws_vpc.this.id,
    ""
  )
}
# Reference local.vpc_id in resources that must be destroyed before CIDR association
```

**Detail:** [references/code-patterns.md](references/code-patterns.md)

---

## 5. CI/CD

**Stages:** validate → test → plan → apply (with approvals for production).

**Cost optimization:** Use mocking in PRs; run integration tests on main; tag test resources; auto-cleanup.

**Detail:** [references/ci-cd-workflows.md](references/ci-cd-workflows.md)

---

## 6. Version management

| Component | Strategy | Example |
|-----------|----------|--------|
| Terraform | Pin minor | `required_version = "~> 1.9"` |
| Providers | Pin major | `version = "~> 5.0"` |
| Modules (prod) | Pin exact | `version = "5.1.2"` |

Workflow: `terraform init` to lock; `terraform init -upgrade` to update within constraints; then plan and test.

---

## 7. Modern features

| Feature | Version | Note |
|---------|---------|------|
| `try()` | 0.13+ | Safe fallbacks |
| `nullable = false` | 1.1+ | Prevent null in variables |
| `moved` blocks | 1.1+ | Refactor without destroy/recreate |
| `optional()` | 1.3+ | Optional object attributes |
| Native tests | 1.6+ | Built-in test framework |
| Mock providers | 1.7+ | Cost-free unit testing |
| Write-only arguments | 1.11+ | Secrets never in state — aligns with `security` |

---

## 8. Naming

For **blueprint** resources use **project-environment-component** ([style-guide](skills/style-guide/SKILL.md)). In generic modules, "this" for singletons is optional.

---

## References

- [testing-frameworks.md](references/testing-frameworks.md)
- [ci-cd-workflows.md](references/ci-cd-workflows.md)
- [code-patterns.md](references/code-patterns.md)
- [module-patterns.md](references/module-patterns.md)
- [quick-reference.md](references/quick-reference.md)
- [security-compliance.md](references/security-compliance.md) — for scanning (trivy, checkov, state security); for secrets and security group rules use **security**.
