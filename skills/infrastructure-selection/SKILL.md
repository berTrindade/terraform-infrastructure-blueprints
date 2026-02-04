---
name: infrastructure-selection
description: Choose the right infrastructure blueprint. Use when the user needs an API, async processing, containers, or cross-cloud equivalent; or when asking which blueprint fits their use case.
---

# Blueprint Selection

**Overview.** This skill helps choose the right blueprint from the catalog using a decision tree, sync vs async, database type, auth, and cross-cloud equivalents. Use it when the user needs to pick a blueprint or compare options.

**When to use**
- User asks "Which blueprint should I use?", "I need an API with PostgreSQL", or "What's the equivalent of X on AWS?"
- User needs to decide between API patterns (sync vs async), database type (DynamoDB vs RDS), auth, or containers
- User wants cross-cloud equivalents (e.g. Mavie on GCP → equivalent on AWS)
- User is starting a new project and needs a recommendation

**When not to use**
- Generating code → use `infrastructure-code-generation` skill
- Fetching blueprint file contents → use MCP `fetch_blueprint_file`
- Detailed pattern rules (secrets, security groups, naming) → use `infrastructure-style-guide` or focused skills

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

## Catalog (short reference)

| Blueprint | Description | Database | Pattern | Use When |
|-----------|-------------|----------|---------|----------|
| `apigw-lambda-dynamodb` | Serverless REST API | DynamoDB | Sync | Simple CRUD, NoSQL |
| `apigw-lambda-dynamodb-cognito` | Serverless API + Auth | DynamoDB | Sync | Need user authentication |
| `apigw-lambda-rds` | Serverless REST API | PostgreSQL | Sync | Relational data, SQL |
| `apigw-lambda-rds-proxy` | Serverless + Connection Pooling | PostgreSQL | Sync | High-traffic production |
| `apigw-lambda-aurora` | Serverless + Aurora | Aurora Serverless | Sync | Variable traffic |
| `appsync-lambda-aurora-cognito` | GraphQL + Auth + Aurora | Aurora | Sync | GraphQL, user auth |
| `apigw-sqs-lambda-dynamodb` | Async Queue Worker | DynamoDB | Async | Background jobs |
| `apigw-eventbridge-lambda` | Event-driven Fanout | N/A | Async | Multiple consumers |
| `apigw-sns-lambda` | Pub/Sub | N/A | Async | Notify multiple systems |
| `alb-ecs-fargate` | Containerized API | N/A | Sync | Custom runtime, containers |
| `alb-ecs-fargate-rds` | Containerized API + RDS | PostgreSQL | Sync | Containers + relational |
| `eks-cluster` | Kubernetes | N/A | N/A | Container orchestration |
| `eks-argocd` | EKS + GitOps | N/A | N/A | GitOps workflow |
| `apigw-lambda-bedrock-rag` | RAG API with Bedrock | OpenSearch | Sync | AI/ML, document Q&A |
| `amplify-cognito-apigw-lambda` | Full-stack + Auth | DynamoDB | Sync | Frontend + backend + auth |
| `functions-postgresql` | Azure Serverless + PostgreSQL | PostgreSQL | Sync | Azure serverless |
| `appengine-cloudsql-strapi` | GCP + Cloud SQL / Strapi | Cloud SQL | Sync | GCP, CMS/Strapi |

## Cross-cloud equivalents

When the user needs the same pattern on another cloud, use MCP `find_by_project(project_name, target_cloud)`.

| Scenario | Example |
|----------|---------|
| GCP → AWS | Mavie uses `appengine-cloudsql-strapi` (GCP) → AWS equivalent: `alb-ecs-fargate-rds` |
| Azure → AWS | `functions-postgresql` → `apigw-lambda-rds` |

**Usage**: `find_by_project(project_name: "Mavie", target_cloud: "aws")`

## When to use MCP vs this skill

- **This skill**: Instant decision tree and catalog lookup; no network. Use for "which blueprint?" and catalog/decision-tree answers.
- **MCP `recommend_blueprint()`**: Requirement-based recommendation (e.g. database + pattern). Use when user describes requirements and you want a tailored suggestion.
- **MCP `search_blueprints(query)`**: Keyword search. Use when user asks "blueprints with X" and you need dynamic search.

**Reference:** [Blueprint Catalog](docs/blueprints/catalog.md)
