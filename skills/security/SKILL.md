---
name: security
description: Use when writing or reviewing Terraform for secrets (RDS/Aurora passwords, Secrets Manager, IAM DB auth) or security group rules (Lambda, RDS, API Gateway, ECS). Ensures no secrets in state and least-privilege network access.
---

# Infrastructure Security

**Overview.** This skill covers two CRITICAL areas: (1) **Secrets** — passwords and secrets must never be stored in Terraform state; use ephemeral passwords or IAM DB auth. (2) **Security groups** — least-privilege rules; never use `0.0.0.0/0` for production data planes (RDS, Lambda in VPC).

**When to use**
- RDS/Aurora/database passwords, Secrets Manager, or IAM database authentication
- Defining or reviewing security group rules for Lambda, RDS, API Gateway, ECS
- User asks about "Lambda connecting to RDS", "security group for API", or "database password in Terraform"

**When not to use**
- Naming or tagging → use `style-guide`
- Selecting blueprints or catalog → use `style-guide`

---

## 1. Secrets and Ephemeral Passwords

### Rule: Never store passwords in state

Passwords must never appear in `terraform.tfstate`. Use ephemeral passwords with `password_wo` or IAM database authentication.

### Ephemeral password pattern (Flow A)

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

**Blueprints:** `alb-ecs-fargate-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds`, `apigw-lambda-rds-proxy`

### IAM database authentication

Enable for RDS/Aurora where supported; applications use IAM tokens instead of passwords:

```hcl
resource "aws_db_instance" "main" {
  iam_database_authentication_enabled = true
}
```

### Secrets Manager

- **Do not** put the actual secret value in Terraform (e.g. `secret_string = random_password.xxx.result`) — that writes the secret to state.
- **Reference only:** Store a reference (ARN/name) in state; set the secret value outside Terraform or via ephemeral + write-only delivery (e.g. `password_wo` to RDS).

**Reference:** [Patterns – Secrets Management](docs/blueprints/patterns.md)

---

## 2. Security Groups – Least-Privilege

### Principles

1. **Least privilege:** Only allow the minimum required ports and sources.
2. **Source by security group (or VPC CIDR), not 0.0.0.0/0** for production resources (RDS, Lambda in VPC).
3. **Explicit descriptions** on rules for audit and maintenance.

### Lambda → RDS rule (RIGHT)

```hcl
resource "aws_security_group_rule" "lambda_to_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
  description              = "Allow Lambda to connect to RDS"
}
```

### WRONG: Open to the world

```hcl
# WRONG: RDS or API open to 0.0.0.0/0 in production
resource "aws_security_group_rule" "rds_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
}
```

### API: public vs private

- **Public API (API Gateway HTTP API):** Ingress to the API can be from internet; restrict backend (Lambda/ECS) to only accept traffic from the API or VPC as appropriate.
- **Private resources (RDS, Lambda in VPC):** No `0.0.0.0/0`; use source security group or private CIDR.

**Blueprints:** `apigw-lambda-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds-proxy`, `alb-ecs-fargate`, `alb-ecs-fargate-rds`, `apigw-lambda-dynamodb`, `apigw-sqs-lambda-dynamodb`

**Reference:** [style-guide](skills/style-guide/SKILL.md) CRITICAL – Security.
