# Project Examples for Supported Scenarios

These examples illustrate the **supported scenarios** from the [Blueprint Workflows](../docs/blueprints/workflows.md). Each folder maps to a consultant scenario and provides concrete, copy-paste-friendly guidance.

| Scenario | Example folder | Description | Workflow |
|----------|----------------|-------------|----------|
| **1a. App exists, single pattern** | [01-app-exists-single-pattern](01-app-exists-single-pattern/) | You have a fullstack app and need one blueprint to deploy it (serverless or containerized). | [Starting a New Project from Blueprint](../docs/blueprints/workflows.md#workflow-starting-a-new-project-from-blueprint) |
| **1b. App exists, hybrid** | [02-app-exists-hybrid](02-app-exists-hybrid/) | You need more than one pattern (e.g. serverless API + containerized CMS). | [Combining Multiple Blueprints](../docs/blueprints/workflows.md#workflow-combining-multiple-blueprints) |
| **2. Existing Terraform, add capability** | [03-existing-terraform-add-capability](03-existing-terraform-add-capability/) | You already have Terraform; you want to add a capability (e.g. SQS, RDS). | [Adding a Resource to an Existing Project](../docs/blueprints/workflows.md#workflow-adding-a-resource-to-an-existing-project) |

## Example overviews

- **01-app-exists-single-pattern** – Minimal “I have an app, I need one blueprint.” Steps to deploy with `apigw-lambda-rds` (serverless API + PostgreSQL) or `alb-ecs-fargate-rds` (containerized API + RDS), with links to the blueprints and workflow.

- **02-app-exists-hybrid** – Combines two patterns (e.g. serverless API + Strapi on ECS). Maps components to blueprints, summarizes merge approach (single VPC, unified naming), and links to the combining workflow.

- **03-existing-terraform-add-capability** – “Before” (minimal API Gateway + Lambda) and “After” (same project + SQS and worker Lambda). Uses the Template Generator or extract-from-blueprint approach and links to the add-capability workflow.

**Note:** For production, copy the blueprint(s) out of the repo and adapt them to your project. These examples reference blueprints in-repo so you can run and compare them from a single clone.
