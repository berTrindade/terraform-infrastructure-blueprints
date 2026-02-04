---
name: security-groups-least-privilege
description: Use when defining or reviewing security group rules for Lambda, RDS, API Gateway, or ECS. Enforces least-privilege and avoids 0.0.0.0/0 in production.
---

# Security Groups – Least-Privilege

**Overview.** This skill enforces least-privilege security group rules for blueprint-based infrastructure: Lambda→RDS, API/public vs private, and never using `0.0.0.0/0` for production data planes.

**When to use**
- Defining or reviewing security group rules for Lambda, RDS, API Gateway, ECS
- User asks about "Lambda connecting to RDS" or "security group for API"
- Code review for ingress/egress rules

**When not to use**
- Secrets or database passwords → use `secrets-and-ephemeral-passwords` skill
- Naming or tagging → use `infrastructure-naming-conventions` or `infrastructure-style-guide`

## Principles

1. **Least privilege:** Only allow the minimum required ports and sources.
2. **Source by security group (or VPC CIDR), not 0.0.0.0/0** for production resources (e.g. RDS, Lambda in VPC).
3. **Explicit descriptions** on rules for audit and maintenance.

## Lambda → RDS rule example

Allow Lambda to reach RDS on PostgreSQL port, using the Lambda security group as source:

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

**Why:** Minimizes attack surface; only the Lambda SG can reach RDS on 5432.

## WRONG vs RIGHT

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

### RIGHT: Source security group

```hcl
# RIGHT: Only Lambda (or ECS) security group can reach RDS
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

## API: public vs private

- **Public API (API Gateway HTTP API):** Ingress to the API can be from internet; still restrict backend (Lambda/ECS) to only accept traffic from the API or VPC as appropriate.
- **Private resources (RDS, Lambda in VPC):** No `0.0.0.0/0`; use source security group or private CIDR.

## Blueprints that apply

- `apigw-lambda-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds-proxy` (Lambda + RDS)
- `alb-ecs-fargate`, `alb-ecs-fargate-rds` (ALB + ECS + optional RDS)
- `apigw-lambda-dynamodb`, `apigw-sqs-lambda-dynamodb` (Lambda + VPC endpoints / networking)

**Reference:** [infrastructure-style-guide](skills/infrastructure-style-guide/SKILL.md) CRITICAL – Security Groups.
