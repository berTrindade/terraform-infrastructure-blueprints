# Blueprint Catalog

Complete reference for all available blueprints, cross-cloud equivalents, decision trees, and blueprint structure patterns.

## Blueprint Catalog

| Blueprint | Description | Database | API Pattern | Use When | Origin |
|-----------|-------------|----------|-------------|----------|--------|
| `apigw-lambda-dynamodb` | Serverless REST API | DynamoDB | Sync | Simple CRUD, NoSQL, lowest cost | TBD |
| `apigw-lambda-dynamodb-cognito` | Serverless API + Auth | DynamoDB | Sync | Need user authentication | TBD |
| `apigw-lambda-rds` | Serverless REST API | PostgreSQL | Sync | Relational data, SQL queries | NBCU Loyalty Build (Backlot) - Web app for fan loyalty & quest rewards (ustwo, 2025) |
| `apigw-lambda-rds-proxy` | Serverless API + Connection Pooling | PostgreSQL | Sync | High-traffic production with RDS | TBD |
| `apigw-lambda-aurora` | Serverless API + Aurora | Aurora Serverless | Sync | Variable/unpredictable traffic | TBD |
| `appsync-lambda-aurora-cognito` | GraphQL API + Auth + Aurora | Aurora Serverless | Sync | GraphQL, user auth, relational data | The Body Coach (ustwo, 2020) |
| `apigw-sqs-lambda-dynamodb` | Async Queue Worker | DynamoDB | Async | Background jobs, decoupled processing | SuprDOG/FetchIQ - Pet health platform with AI-powered lab analysis and product recommendations (ustwo, 2025) |
| `apigw-eventbridge-lambda` | Event-driven Fanout | N/A | Async | Multiple consumers, event routing | TBD |
| `apigw-sns-lambda` | Pub/Sub Pattern | N/A | Async | Notify multiple systems | TBD |
| `alb-ecs-fargate` | Containerized API | N/A | Sync | Custom runtime, containers | Sproufiful - AI meal planning app (ustwo, 2024), Samsung Maestro - AI collaboration tool (ustwo, 2025) |
| `alb-ecs-fargate-rds` | Containerized API + RDS | PostgreSQL | Sync | Containers with relational data | TBD |
| `eks-cluster` | Kubernetes Cluster | N/A | N/A | Container orchestration at scale | TBD |
| `eks-argocd` | EKS + GitOps | N/A | N/A | GitOps deployment workflow | RVO QuitBuddy - AI-powered smoking cessation platform with event-driven architecture (ustwo, 2025) |
| `apigw-lambda-bedrock-rag` | RAG API with Bedrock | OpenSearch | Sync | AI/ML, document Q&A | Cancer Platform (Backend) - RAG API for document Q&A (ustwo, 2025) |
| `amplify-cognito-apigw-lambda` | Full-stack with Auth | DynamoDB | Sync | Frontend + backend + auth | Cancer Platform (Frontend) - Next.js app for document management (ustwo, 2024) |
| `functions-postgresql` | Serverless API with PostgreSQL | PostgreSQL Flexible Server | Sync | Azure serverless, relational data | HM Impuls - WhatsApp-based pitch submission platform (ustwo, 2025) |
| `appengine-cloudsql-strapi` | Containerized app with Cloud SQL | Cloud SQL PostgreSQL | Sync | GCP serverless, CMS/Strapi | Mavie iOS - Mobile app backend with Strapi CMS (ustwo, 2025) |

## Cross-Cloud Equivalents

When you need the same infrastructure pattern on a different cloud provider, use the `find_by_project` tool with the `target_cloud` parameter.

### Containerized Application with PostgreSQL

| GCP Blueprint | AWS Equivalent | Azure Equivalent | Notes |
|---------------|----------------|------------------|-------|
| `appengine-cloudsql-strapi` | `alb-ecs-fargate-rds` | `functions-postgresql` | Containerized app → ECS Fargate (AWS) or Functions (Azure). Note: Azure Functions is serverless, not containers. |

### Serverless API with PostgreSQL

| Azure Blueprint | AWS Equivalent | GCP Equivalent | Notes |
|-----------------|----------------|----------------|-------|
| `functions-postgresql` | `apigw-lambda-rds` | `appengine-cloudsql-strapi` | Serverless Functions → Lambda (AWS) or App Engine (GCP) |

### Project-Based Queries

You can find blueprints by project name and get cross-cloud equivalents:

**Example**: "I need what was done for Mavie but for AWS"
- Mavie uses: `appengine-cloudsql-strapi` (GCP)
- AWS equivalent: `alb-ecs-fargate-rds`

**Usage**: Use the `find_by_project` tool:
```typescript
find_by_project({
  project_name: "Mavie",
  target_cloud: "aws"
})
```

## Decision Tree

```
What do you need?
├── API (request/response)
│   ├── Need authentication?
│   │   ├── Yes → apigw-lambda-dynamodb-cognito or amplify-cognito-apigw-lambda
│   │   └── No → Continue...
│   ├── Database type?
│   │   ├── NoSQL (DynamoDB)
│   │   │   └── apigw-lambda-dynamodb
│   │   ├── SQL (PostgreSQL)
│   │   │   ├── High traffic? → apigw-lambda-rds-proxy
│   │   │   ├── Variable traffic? → apigw-lambda-aurora
│   │   │   └── Standard → apigw-lambda-rds
│   │   └── None → apigw-lambda-dynamodb (simplest)
│   ├── Need GraphQL?
│   │   └── Yes → appsync-lambda-aurora-cognito
│   └── Need containers?
│       ├── With database → alb-ecs-fargate-rds
│       └── Without → alb-ecs-fargate
├── Async/Background Processing
│   ├── Queue-based worker → apigw-sqs-lambda-dynamodb
│   ├── Event fanout (multiple consumers) → apigw-eventbridge-lambda
│   └── Pub/sub notifications → apigw-sns-lambda
├── Kubernetes
│   ├── With GitOps → eks-argocd
│   └── Standard → eks-cluster
└── AI/ML
    └── RAG/Document Q&A → apigw-lambda-bedrock-rag
```

## Blueprint Structure

Every blueprint follows this pattern:

```
aws/{blueprint-name}/
├── environments/
│   └── dev/
│       ├── main.tf           # Module composition
│       ├── variables.tf      # Input variables  
│       ├── outputs.tf        # Outputs
│       ├── versions.tf       # Provider versions
│       ├── terraform.tfvars  # Default values
│       └── backend.tf.example
├── modules/                  # Self-contained modules
│   ├── api/                  # API Gateway configuration
│   ├── compute/              # Lambda or ECS
│   ├── data/                 # Database (DynamoDB, RDS, etc.)
│   ├── networking/           # VPC, subnets, security groups
│   ├── naming/               # Naming conventions
│   └── tagging/              # Resource tags
├── src/                      # Application code (if any)
├── tests/                    # Terraform tests
└── README.md                 # Blueprint-specific docs
```
