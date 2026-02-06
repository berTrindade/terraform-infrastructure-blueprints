# Example 3: Existing Terraform, Add Capability (Scenario 2)

**What this example demonstrates:** You already have a Terraform project (e.g. API Gateway + Lambda). You want to **add a capability**—here, SQS and a worker Lambda for background processing—without rewriting the whole project.

## Before and after

| | Contents |
|---|----------|
| **before/** | Minimal “existing” Terraform: API Gateway + Lambda only (no queue, no worker). |
| **after/** | Same project with SQS (main queue + DLQ) and a worker Lambda that consumes from the queue. Uses the blueprint’s queue module and a worker Lambda wired to SQS. |

You can run `terraform init`, `plan`, and `apply` in either folder (from repo root, paths in the example point at the blueprints).

## How to add the capability

1. **Prefer Template Generator** (when a manifest exists):
   - See [Manifests and Templates](../../docs/manifests-and-templates.md) to generate code adapted to your project's conventions (naming, tagging, existing modules).

2. **Fallback: extract from blueprint**
   - Use the [Extractable patterns](../../docs/blueprints/workflows.md#extractable-patterns-by-capability) table.
   - For SQS: source blueprint [apigw-sqs-lambda-dynamodb](../../../blueprints/aws/apigw-sqs-lambda-dynamodb); extract `modules/queue/` and add a worker Lambda (see blueprint’s `environments/dev/main.tf` for the worker and SQS event source mapping).

## Steps for this example

1. **Inspect before:**  
   `cd examples/03-existing-terraform-add-capability/before`  
   Run `terraform init` and `terraform plan` (set `project`, `environment`, and optionally `aws_region` via `terraform.tfvars` or `-var`).

2. **Inspect after:**  
   `cd examples/03-existing-terraform-add-capability/after`  
   Same; `after` adds the queue module and worker Lambda, referencing:
   - [blueprints/aws/apigw-sqs-lambda-dynamodb/modules/queue](../../blueprints/aws/apigw-sqs-lambda-dynamodb/modules/queue)
   - Worker Lambda and SQS trigger pattern from the same blueprint’s `environments/dev/main.tf`.

3. **In your own repo:** Copy or generate the queue + worker code (Template Generator or extracted modules), then adapt naming, tagging, and any existing VPC/security groups to match your project.

## Links

- **Workflow:** [Adding a Resource to an Existing Project](../../docs/blueprints/workflows.md#workflow-adding-a-resource-to-an-existing-project)
- **Manifests and Template Generator:** [Manifests and Templates](../../docs/manifests-and-templates.md)
- **Source blueprint for SQS/worker:** [apigw-sqs-lambda-dynamodb](../../blueprints/aws/apigw-sqs-lambda-dynamodb)
- **Extractable patterns table:** [Workflows – Extractable patterns by capability](../../docs/blueprints/workflows.md#extractable-patterns-by-capability)
