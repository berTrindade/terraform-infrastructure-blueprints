# Example 2: App Exists, Hybrid (Scenario 1b)

**What this example demonstrates:** You need **more than one** infrastructure pattern—e.g. a serverless API (Lambda, DynamoDB, API Gateway) plus a containerized CMS (Strapi on ECS Fargate with RDS). This scenario combines two blueprints into one project.

## Map components to blueprints

| Component | Blueprint | Purpose |
|-----------|-----------|---------|
| Serverless API | [apigw-lambda-dynamodb](../../blueprints/aws/apigw-lambda-dynamodb) | Lambda + DynamoDB + API Gateway |
| Containerized CMS (e.g. Strapi) | [alb-ecs-fargate-rds](../../blueprints/aws/alb-ecs-fargate-rds) | ECS Fargate + ALB + RDS (PostgreSQL for Strapi) |

## High-level merge approach

When combining blueprints, keep one project and shared foundations:

1. **Single VPC** – Use one VPC module (or the VPC from one blueprint) and put both API and CMS in it.
2. **Unified naming** – Use a consistent pattern, e.g. `{project}-{env}-{component}` (e.g. `myapp-dev-api`, `myapp-dev-cms`).
3. **Shared security groups** – Reuse where it makes sense (e.g. database access from ECS and, if needed, Lambda).
4. **Consolidated root** – One `environments/dev/` (or similar) that composes modules from both patterns.

## Steps (summary)

1. **Download both blueprints** (clone this repo or copy the two blueprint folders).
2. **Copy or reference**:
   - From `apigw-lambda-dynamodb`: `modules/api`, `modules/data`, `modules/naming`, `modules/tagging` (and optionally networking if you use the same VPC).
   - From `alb-ecs-fargate-rds`: `modules/compute`, `modules/networking`, `modules/data` (for RDS), `modules/naming`, `modules/tagging`.
3. **Merge into one project**:
   - Single `main.tf` (or one per environment) that instantiates both API and CMS modules.
   - One VPC shared by Lambda and ECS.
   - One naming/tagging convention; ensure resource names don’t clash (e.g. different `component` suffixes).
4. **Security groups** – Allow Lambda → DynamoDB and ECS → RDS; restrict ingress to what each component needs.

## Architecture (conceptual)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                         VPC                             │
  Internet          │  ┌─────────────┐    ┌──────────────┐   ┌─────────────┐ │
  ───────► API GW ──►│  │   Lambda    │───►│  DynamoDB    │   │             │ │
                    │  └─────────────┘    └──────────────┘   │             │ │
                    │         (apigw-lambda-dynamodb)         │  ECS        │ │
  ───────► ALB  ───►│                                         │  Fargate    │ │
                    │                                         │  (Strapi)   │ │
                    │                                         │      │      │ │
                    │                                         │      ▼      │ │
                    │                                         │   RDS       │ │
                    │                                         └─────────────┘ │
                    │                              (alb-ecs-fargate-rds)     │
                    └─────────────────────────────────────────────────────────┘
```

## Links

- **Workflow:** [Combining Multiple Blueprints](../../docs/blueprints/workflows.md#workflow-combining-multiple-blueprints)
- **API blueprint:** [blueprints/aws/apigw-lambda-dynamodb](../../blueprints/aws/apigw-lambda-dynamodb)
- **CMS blueprint:** [blueprints/aws/alb-ecs-fargate-rds](../../blueprints/aws/alb-ecs-fargate-rds)
- **Catalog:** [Blueprint Catalog](../../docs/blueprints/catalog.md)
