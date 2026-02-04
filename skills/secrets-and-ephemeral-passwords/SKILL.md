---
name: secrets-and-ephemeral-passwords
description: Use when writing or reviewing Terraform that touches RDS/Aurora passwords, Secrets Manager, or IAM database authentication. Ensures secrets never land in state.
---

# Secrets and Ephemeral Passwords

**Overview.** This skill enforces the rule that **passwords and secrets must never be stored in Terraform state**. It covers ephemeral passwords (Flow A), IAM database authentication, and when to use Secrets Manager (reference only, no raw secret in state).

**When to use**
- Writing or reviewing Terraform for RDS, Aurora, or any database with a password
- User asks about database password management, Secrets Manager, or IAM DB auth
- Adding a database to an existing project (ensure ephemeral pattern is used)

**When not to use**
- Security group rules (no secrets) → use `security-groups-least-privilege` skill
- General naming or tagging → use `infrastructure-naming-conventions` or `infrastructure-style-guide`

## Rule: Never store passwords in state

Passwords must never appear in `terraform.tfstate`. Use ephemeral passwords with `password_wo` or IAM database authentication.

## Ephemeral password pattern (Flow A)

Use `ephemeral` and `password_wo` so the password is never written to state:

```hcl
# WRONG: Password stored in state
resource "aws_secretsmanager_secret_version" "db" {
  secret_string = random_password.db.result  # Password in state!
}

# RIGHT: Ephemeral password (never in state)
ephemeral "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_instance" "main" {
  password_wo         = ephemeral.random_password.db_password.result
  password_wo_version = 1
  # Password NEVER in terraform.tfstate
}
```

**Used in blueprints:** `alb-ecs-fargate-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds`, `apigw-lambda-rds-proxy`

**Why:** Passwords never stored in Terraform state; improves security posture.

## IAM database authentication

Always enable IAM database authentication for RDS/Aurora where supported. Applications then use IAM tokens instead of passwords:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
  # Applications use IAM tokens, not passwords
}
```

**Why:** Eliminates password management and rotation in application config.

## Secrets Manager

- **Do not** put the actual secret value in Terraform (e.g. `secret_string = random_password.xxx.result`). That writes the secret to state.
- **Reference only:** Store a reference (ARN/name) in state; the secret value is set outside Terraform or via ephemeral + write-only delivery to the service (e.g. `password_wo` to RDS).

## Blueprints that use this pattern

- `alb-ecs-fargate-rds`
- `apigw-lambda-aurora`
- `apigw-lambda-rds`
- `apigw-lambda-rds-proxy`

**Reference:** [Patterns – Secrets Management](docs/blueprints/patterns.md), [infrastructure-style-guide](skills/infrastructure-style-guide/SKILL.md) CRITICAL section.
