# Terraform Infrastructure Blueprints

Opinionated, repeatable Infrastructure-as-Code blueprints for bootstrapping cloud foundations across AWS, Azure, and GCP. Each blueprint is a fully self-contained IaC package that includes everything needed to deploy that pattern: modules, configurations, and conventions all in one place.

Consultants copy the example they need or extract patterns to add to existing projects, adapt it, and hand over clean, client-owned infrastructure code. No dependencies. No shared modules. No vendor lock-in.

## Features

- **Self-Contained Blueprints** - Each blueprint includes all modules, configurations, and documentation needed to deploy
- **Multiple Cloud Providers** - AWS, Azure, and GCP blueprints available
- **Production-Ready Patterns** - Battle-tested infrastructure patterns for serverless, containers, and Kubernetes
- **Zero Vendor Lock-in** - No dependencies on ustwo systems or shared modules - clients own everything
- **AI-Optimized Structure** - Blueprints designed for easy AI-assisted code generation and adaptation
- **Security Best Practices** - Ephemeral secrets, least-privilege IAM, and security scanning built-in
- **Multiple Usage Patterns** - Copy entire blueprints or extract specific modules for existing projects

## Quick Start

Deploy any blueprint in 3 steps:

```bash
# 1. Download a blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-dynamodb my-api

# 2. Navigate and configure
cd my-api/environments/dev
# Edit terraform.tfvars with your project name and AWS region

# 3. Deploy
terraform init
terraform plan
terraform apply
```

For detailed guides, see:

- [Deployment Guide](docs/guides/deployment.md) - Step-by-step deployment instructions
- [Environment Creation](docs/guides/environments.md) - Creating staging and production environments
- [Testing Guide](docs/guides/testing.md) - Running and writing Terraform tests
- [CI/CD Pipeline](docs/guides/cicd.md) - Setting up CI/CD workflows

Each blueprint also includes a blueprint-specific README with detailed instructions.

## Ways to Use

### Copy Whole Blueprint

Start new projects from scratch by copying an entire blueprint:

```bash
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/apigw-lambda-rds ./infra
```

Each blueprint is self-contained—copy it and you have everything needed to deploy.

### Extract Patterns

Add capabilities to existing Terraform projects by extracting modules from blueprints:

- **Database (RDS)** → Extract from `apigw-lambda-rds/modules/data/`
- **Queue (SQS)** → Extract from `apigw-sqs-lambda-dynamodb/modules/queue/`
- **Auth (Cognito)** → Extract from `apigw-lambda-dynamodb-cognito/modules/auth/`
- **AI/RAG** → Extract from `apigw-lambda-bedrock-rag/modules/ai/`

See [ADR-0002](docs/adr/0002-expand-scope-pattern-extraction.md) for the rationale behind supporting both workflows.

## Available Blueprints

### AWS (14 blueprints)

| Category      | Blueprints                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Serverless** | `apigw-lambda-dynamodb`, `apigw-lambda-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds-proxy`, `apigw-lambda-dynamodb-cognito`                |
| **Containers** | `alb-ecs-fargate`, `alb-ecs-fargate-rds`                                                                                                     |
| **Kubernetes** | `eks-cluster`, `eks-argocd`                                                                                                                  |
| **Event-Driven** | `apigw-sqs-lambda-dynamodb`, `apigw-eventbridge-lambda`, `apigw-sns-lambda`                                                                  |
| **AI/ML**      | `apigw-lambda-bedrock-rag`                                                                                                                   |
| **Full-Stack** | `amplify-cognito-apigw-lambda`, `appsync-lambda-aurora-cognito`                                                                              |

### Azure (1 blueprint)

- `azure-functions-postgresql` - Serverless API with PostgreSQL

### GCP (1 blueprint)

- `gcp-appengine-cloudsql-strapi` - Containerized app with Cloud SQL

**Full blueprint catalog with descriptions, use cases, and decision trees:** See [AGENTS.md](AGENTS.md)

## Architecture Decision Records

We use [ADRs](docs/adr/README.md) to document significant architectural decisions:

| ADR | Title | Status |
|-----|-------|--------|
| [0001](docs/adr/0001-standalone-blueprints.md) | Standalone Self-Contained Blueprints | Approved |
| [0002](docs/adr/0002-expand-scope-pattern-extraction.md) | Expand Scope to Support Pattern Extraction | Approved |
| [0003](docs/adr/0003-mcp-server-ai-discovery.md) | MCP Server for AI-Assisted Blueprint Discovery | Approved |
| [0004](docs/adr/0004-supported-consultant-scenarios.md) | Supported Consultant Scenarios | Approved |
| [0005](docs/adr/0005-secrets-management-pattern.md) | Secrets Management Pattern | Approved |
| [0006](docs/adr/0006-progressive-disclosure-agents.md) | Progressive Disclosure for AGENTS.md | Approved |

## Key Information

- **Secrets Management**: All blueprints use a two-flow pattern for secure secret handling. See [ADR-0005](docs/adr/0005-secrets-management-pattern.md) for details.
- **Terraform Version**: Requires Terraform >= 1.11 (for ephemeral values and write-only attributes)
- **Official Modules**: Blueprints use [terraform-aws-modules](https://registry.terraform.io/namespaces/terraform-aws-modules) for battle-tested infrastructure components

## AI Assistant Integration

For ustwo developers: Configure the MCP server to give AI assistants automatic awareness of these blueprints. See [mcp-server/README.md](mcp-server/README.md) for setup instructions.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and pre-commit hooks
- Code style and testing requirements
- Pull request process
- Documentation standards

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

- **Maintainer**: Bernardo Trindade de Abreu
- **Email**: <bernardo.trindade-de-abreu@ustwo.com>
- **GitHub Issues**: [Open an issue](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues) for bug reports or feature requests
- **Pull Requests**: [Submit a PR](https://github.com/berTrindade/terraform-infrastructure-blueprints/pulls) for contributions
