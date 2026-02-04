---
name: infrastructure-naming-conventions
description: Use when naming resources, tagging, or applying project-environment-component patterns in Terraform for blueprint-based infrastructure.
---

# Blueprint Naming Conventions

**Overview.** This skill defines the naming pattern and tags used in blueprints: `{project}-{environment}-{component}` and standard tags (Environment, ManagedBy, Name). Use it when naming resources or applying tags in blueprint-based Terraform.

**When to use**
- Naming Terraform resources (identifiers, subnet groups, security groups)
- Applying or reviewing tags (Environment, ManagedBy, Name)
- User asks "how do we name resources?" or "what tags should we use?"

**When not to use**
- Security (secrets, security groups) → use `secrets-and-ephemeral-passwords` or `security-groups-least-privilege`
- Choosing a blueprint → use `infrastructure-selection` or `infrastructure-style-guide`

## Pattern: project–environment–component

All resources follow:

**`{project}-{environment}-{component}`**

Examples:
- Prefix: `myapp-dev` → resources like `myapp-dev-api`, `myapp-dev-db`
- DB identifier: `myapp-dev-db`
- Subnet group: `myapp-dev-db-subnets`
- Security group (suffix): `myapp-dev-api-sg`

## Naming module usage

```hcl
module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

# module.naming.prefix → "myapp-dev"
# Resource: "${module.naming.prefix}-api" → "myapp-dev-api"
# Resource: "${module.naming.prefix}-db"   → "myapp-dev-db"
```

**Why:** Consistent naming makes resources easy to identify and manage across environments.

## Tags

Apply at least:

| Tag | Purpose | Example |
|-----|---------|---------|
| **Environment** | Environment name | `dev`, `staging`, `prod` |
| **ManagedBy** | IaC tool | `terraform` |
| **Name** | Human-readable name | Same as or derived from `{project}-{env}-{component}` |

Use the blueprint `modules/tagging` (or equivalent) so tags are consistent.

## Resource naming examples

| Resource type | Example identifier / name |
|---------------|----------------------------|
| RDS instance | `myapp-dev-db` |
| DB subnet group | `myapp-dev-db-subnets` |
| Lambda function | `myapp-dev-api` (or suffix `-lambda`) |
| Security group | `myapp-dev-api-sg`, `myapp-dev-db-sg` |
| API Gateway | `myapp-dev-api` |

## Customization

For region, project name, instance size, or tags, see [Customization](docs/blueprints/customization.md). Naming should still follow the same pattern with the chosen project and environment.

**Reference:** [Patterns – Naming](docs/blueprints/patterns.md), [infrastructure-style-guide](skills/infrastructure-style-guide/SKILL.md) HIGH – Naming Convention.
