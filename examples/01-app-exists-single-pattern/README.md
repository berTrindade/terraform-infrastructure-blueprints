# Example 1: App Exists, Single Pattern (Scenario 1a)

**What this example demonstrates:** You have a fullstack app (e.g. React + Node + PostgreSQL) and need **one** blueprint to deploy it to AWS. No hybrid patterns—one deployment pattern fits your app.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.9 (1.11+ if using RDS/ephemeral secrets)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- Node.js (optional; only if you run the app locally)

## Option A: Serverless API + PostgreSQL

Use the **apigw-lambda-rds** blueprint for a serverless REST API with Lambda and RDS PostgreSQL.

1. From the repo root:
   ```bash
   cd blueprints/aws/apigw-lambda-rds/environments/dev
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Edit `terraform.tfvars` with your `project` name and `aws_region`.
3. Run:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

**Blueprint:** [blueprints/aws/apigw-lambda-rds](../../blueprints/aws/apigw-lambda-rds) – includes API Gateway, Lambda, RDS, VPC, and ephemeral secrets pattern.

## Option B: Containerized API + RDS

Use the **alb-ecs-fargate-rds** blueprint to run your app in containers (e.g. Docker) behind an ALB with ECS Fargate and RDS.

1. From the repo root:
   ```bash
   cd blueprints/aws/alb-ecs-fargate-rds/environments/dev
   cp terraform.tfvars.example terraform.tfvars
   ```
2. Edit `terraform.tfvars` with your project name and region.
3. Run:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

**Blueprint:** [blueprints/aws/alb-ecs-fargate-rds](../../blueprints/aws/alb-ecs-fargate-rds) – includes ALB, ECS Fargate, RDS, VPC.

## Optional: Minimal app placeholder

The [app/](app/) folder is a minimal placeholder representing “the app you have” before adding infrastructure. Replace it with your real app; the blueprints include their own `src/` (e.g. Lambda handler or container image source) where relevant.

## Next steps

- **Workflow:** [Starting a New Project from Blueprint](../../docs/blueprints/workflows.md#workflow-starting-a-new-project-from-blueprint)
- **Catalog:** [Blueprint Catalog](../../docs/blueprints/catalog.md) – all blueprints with use cases and decision trees
- **Customization:** [Customization](../../docs/blueprints/customization.md) – common customizations and commands
