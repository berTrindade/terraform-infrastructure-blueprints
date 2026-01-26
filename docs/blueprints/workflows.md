# Blueprint Workflows

Step-by-step workflows for using blueprints in different scenarios.

## Supported Scenarios

This repository supports two core consultant scenarios. Understanding which scenario applies helps provide the right guidance.

### Scenario 1: App Exists, Need Infrastructure

**User says**: "I have a fullstack app running locally (React + Node.js + PostgreSQL). I need to deploy it to AWS."

**Or hybrid cases**: "I need AWS infrastructure (Lambda, Dynamo, API Gateway) but I also want a Strapi instance (which presumably involves EC2 or Fargate and a bunch of other supporting AWS infrastructure, with a Strapi image in the middle of it)."

**AI should**:
1. Ask about the tech stack and whether they want to containerize or go serverless
2. **For single-pattern needs**: Recommend `alb-ecs-fargate-rds` (containerize as-is) or `apigw-lambda-rds` (refactor to serverless)
3. **For hybrid/composite needs**: Identify multiple infrastructure patterns required and recommend combining blueprints (e.g., serverless API + containerized CMS)
4. Provide tiged command(s) to download the blueprint(s)
5. Guide through configuration and deployment (or combining patterns if multiple blueprints)

### Scenario 2: Existing Terraform, Add Capability

**User says**: "I have an existing Terraform project with API Gateway and Lambda. I need to add SQS for background processing."

**AI should**:
1. Ask about existing infrastructure (VPC, naming conventions, etc.)
2. Identify relevant blueprint: `apigw-sqs-lambda-dynamodb`
3. Extract the relevant modules (`modules/queue/`, `modules/worker/`)
4. Adapt code to fit existing project conventions
5. Provide standalone Terraform that integrates with their existing setup

**Extractable patterns by capability**:
| Capability | Source Blueprint | Modules to Extract |
|------------|------------------|-------------------|
| Database (RDS) | `apigw-lambda-rds` | `modules/data/`, `modules/networking/` |
| Queue (SQS) | `apigw-sqs-lambda-dynamodb` | `modules/queue/`, `modules/worker/` |
| Auth (Cognito) | `apigw-lambda-dynamodb-cognito` | `modules/auth/` |
| Events (EventBridge) | `apigw-eventbridge-lambda` | `modules/events/` |
| AI/RAG (Bedrock) | `apigw-lambda-bedrock-rag` | `modules/ai/`, `modules/vectorstore/` |
| Containerized CMS/App | `alb-ecs-fargate-rds` or `alb-ecs-fargate` | `modules/compute/`, `modules/networking/`, `modules/data/` (if database needed) |

## Workflow: Adding a Resource to an Existing Project

**User says**: "I need to add RDS to my existing Terraform project"

**AI should**:

1. **Ask discovery questions**:
   - "What AWS region is your project in?"
   - "Do you have an existing VPC? If so, what are the VPC ID and private subnet IDs?"
   - "What's your naming convention (e.g., `project-env-component`)?"
   - "Do you need the ephemeral secrets pattern for credentials?"
   - "Which resources need database access (e.g., Lambda, ECS)?"

2. **Identify relevant modules** from blueprints:
   - `modules/data/` - RDS instance configuration
   - `modules/networking/` or security group rules
   - Secrets Manager for connection metadata

3. **Extract and adapt code**:
   - Copy relevant module code from `apigw-lambda-rds/modules/data/`
   - Adapt variables to match existing project's VPC, naming, etc.
   - Ensure security groups allow access from compute resources

4. **Provide standalone Terraform**:
   - Code must work without any reference to this blueprints repo
   - Include all necessary variables and outputs
   - Follow the project's existing conventions

## Workflow: Starting a New Project from Blueprint

**User says**: "I'm starting a new project and need a serverless API with PostgreSQL"

**AI should**:

1. **Ask discovery questions**:
   - "What type of database? (DynamoDB / PostgreSQL / Aurora)"
   - "Do you need authentication (Cognito)?"
   - "Sync API or async processing (queues)?"
   - "Expected traffic level? (affects RDS vs RDS Proxy choice)"
   - "Project name and AWS region?"

2. **Recommend blueprint**:
   - Based on answers, suggest the matching blueprint from the catalog
   - Explain why it fits their needs

3. **Provide setup instructions**:
   ```bash
   # Download the blueprint
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-rds ./infra
   
   # Navigate and configure
   cd infra/environments/dev
   
   # Edit terraform.tfvars with project name and region
   # Configure AWS credentials
   
   # Deploy
   terraform init
   terraform plan
   terraform apply
   ```

4. **Offer customization help**:
   - Adjust instance sizes
   - Add additional environments (staging, prod)
   - Customize security groups
   - Add monitoring/alerting

## Workflow: Combining Multiple Blueprints

**User says**: "I need AWS infrastructure (Lambda, Dynamo, API Gateway) but I also want a Strapi instance (which presumably involves EC2 or Fargate and a bunch of other supporting AWS infrastructure, with a Strapi image in the middle of it)."

**AI should**:

1. **Recognize hybrid needs**: Identify that user needs multiple infrastructure patterns combined
   - Example: Serverless API (Lambda/DynamoDB/API Gateway) + Containerized CMS (Strapi on ECS Fargate)

2. **Identify component blueprints**: Map each component to appropriate blueprint(s)
   - Serverless API → `apigw-lambda-dynamodb`
   - Containerized CMS → `alb-ecs-fargate-rds` (if database needed) or `alb-ecs-fargate`

3. **Choose approach**:
   - **Option A: Copy both blueprints and merge** (for new projects)
     - Download both blueprints to separate directories
     - Merge modules into single project structure
     - Consolidate shared resources (VPC, networking, naming)
   - **Option B: Extract modules from both blueprints** (for existing projects)
     - Extract relevant modules from each blueprint
     - Integrate into existing project structure
     - Adapt to existing conventions

4. **Handle shared infrastructure**:
   - **Single VPC**: Use one VPC module shared across both patterns
   - **Unified naming**: Ensure consistent naming conventions across components
   - **Shared security groups**: Reuse security groups where appropriate (e.g., database access)
   - **Consolidated outputs**: Merge outputs from both patterns

5. **Provide step-by-step guidance**:
   ```bash
   # Download both blueprints
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-dynamodb ./infra-api
   npx tiged berTrindade/terraform-infrastructure-blueprints/aws/alb-ecs-fargate-rds ./infra-cms
   
   # Merge into single project structure
   # - Combine modules/ directories
   # - Merge environments/dev/main.tf
   # - Consolidate VPC/networking modules
   # - Unify naming and tagging
   ```

6. **Specific Strapi guidance**:
   - Use `alb-ecs-fargate-rds` for Strapi (Strapi typically needs PostgreSQL)
   - Extract ECS Fargate modules from `alb-ecs-fargate-rds`
   - Extract API Gateway/Lambda modules from `apigw-lambda-dynamodb`
   - Share VPC and networking between both components
   - Ensure security groups allow Lambda → DynamoDB and ECS → RDS connections
   - Use unified naming: `{project}-{env}-{component}` (e.g., `myapp-dev-api`, `myapp-dev-cms`)
