# Terraform Infrastructure Blueprints

[![CI/CD](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/validate.yml/badge.svg)](https://github.com/berTrindade/terraform-infrastructure-blueprints/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io%2Fbertrindade%2Finfra--mcp-blue)](https://github.com/berTrindade/terraform-infrastructure-blueprints/pkgs/container/infra-mcp)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)

Opinionated, repeatable Infrastructure-as-Code blueprints for bootstrapping cloud foundations across AWS, Azure, and GCP. Each blueprint is a fully self-contained IaC package that includes everything needed to deploy that pattern: modules, configurations, and conventions all in one place.

Consultants copy the example they need or extract patterns to add to existing projects, adapt it, and hand over clean, client-owned infrastructure code. No dependencies. No shared modules. No vendor lock-in.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Ways to Use](#ways-to-use)
- [Available Blueprints](#available-blueprints)
- [Blueprint Structure](#blueprint-structure)
- [Architecture Decision Records](#architecture-decision-records)
- [Key Information](#key-information)
- [AI Assistant Integration](#ai-assistant-integration)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **Self-Contained Blueprints** - Each blueprint includes all modules, configurations, and documentation needed to deploy
- **Multiple Cloud Providers** - AWS (16 blueprints), Azure (1 blueprint), and GCP (1 blueprint) available
- **Production-Ready Patterns** - Battle-tested infrastructure patterns from real client projects
- **Zero Vendor Lock-in** - No dependencies on ustwo systems or shared modules - clients own everything
- **AI-Optimized Structure** - Blueprints designed for easy AI-assisted code generation and adaptation
- **Security Best Practices** - Ephemeral secrets, least-privilege IAM, and security scanning built-in
- **Multiple Usage Patterns** - Copy entire blueprints or extract specific modules for existing projects
- **Comprehensive Testing** - Each blueprint includes Terraform tests for validation
- **Cross-Cloud Equivalents** - Find equivalent patterns across AWS, Azure, and GCP

## Quick Start

### Using MCP Server (AI-Assisted)

If you have the MCP server configured (see [AI Assistant Integration](#ai-assistant-integration)):

1. **Ask your AI assistant** to recommend a blueprint based on your requirements (e.g., "I need a serverless API with PostgreSQL")
2. **Review the recommendation** - The AI will suggest the best blueprint and provide details
3. **Download the blueprint** - The AI will provide the exact download command
4. **Get guided setup** - The AI can help you configure and customize the blueprint

**Prerequisites:**

- Terraform >= 1.9 (some blueprints require >= 1.11 - see individual READMEs)
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

For detailed guides, see:

- [Deployment Guide](docs/guides/deployment.md) - Step-by-step deployment instructions
- [Environment Creation](docs/guides/environments.md) - Creating staging and production environments
- [Testing Guide](docs/guides/testing.md) - Running and writing Terraform tests
- [CI/CD Pipeline](docs/guides/cicd.md) - Setting up CI/CD workflows

Each blueprint also includes a blueprint-specific README with detailed instructions, architecture diagrams, and cost estimates.

## Ways to Use

### Copy Whole Blueprint

Start new projects from scratch by copying an entire blueprint:

#### AI-assisted (with MCP server)

- Ask your AI assistant: "I need a serverless API with PostgreSQL"
- The AI will recommend `apigw-lambda-rds` and provide download instructions
- Follow the guided setup instructions

Each blueprint is self-contained—copy it and you have everything needed to deploy.

### Extract Patterns

Add capabilities to existing Terraform projects by extracting modules from blueprints:

#### AI-assisted pattern extraction

- Ask your AI assistant: "I need to add SQS queue processing to my existing Terraform"
- The AI will use `extract_pattern()` to identify the right modules and provide adapted code
- The AI can fetch specific blueprint files and adapt them to your project structure

#### Manual extraction

If you prefer to extract manually, common patterns include:

- **Database (RDS)** → Extract from `apigw-lambda-rds/modules/data/`
- **Database (DynamoDB)** → Extract from `apigw-lambda-dynamodb/modules/data/`
- **Queue (SQS)** → Extract from `apigw-sqs-lambda-dynamodb/modules/queue/`
- **Auth (Cognito)** → Extract from `apigw-lambda-dynamodb-cognito/modules/auth/`
- **AI/RAG** → Extract from `apigw-lambda-bedrock-rag/modules/ai/`
- **VPC/Networking** → Extract from `alb-ecs-fargate-rds/modules/vpc/` or `eks-cluster/modules/vpc/`

See [ADR-0002](docs/adr/0002-expand-scope-pattern-extraction.md) for the rationale behind supporting both workflows.

## Available Blueprints

### AWS (16 blueprints)

| Category      | Blueprints                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Serverless** | `apigw-lambda-dynamodb`, `apigw-lambda-rds`, `apigw-lambda-aurora`, `apigw-lambda-rds-proxy`, `apigw-lambda-dynamodb-cognito`, `apigw-lambda-dynamodb-strapi` |
| **Containers** | `alb-ecs-fargate`, `alb-ecs-fargate-rds`                                                                                                     |
| **Kubernetes** | `eks-cluster`, `eks-argocd`                                                                                                                  |
| **Event-Driven** | `apigw-sqs-lambda-dynamodb`, `apigw-eventbridge-lambda`, `apigw-sns-lambda`                                                                  |
| **AI/ML**      | `apigw-lambda-bedrock-rag`                                                                                                                   |
| **Full-Stack** | `amplify-cognito-apigw-lambda`, `appsync-lambda-aurora-cognito`                                                                              |

### Azure (1 blueprint)

- `functions-postgresql` - Serverless API with PostgreSQL

### GCP (1 blueprint)

- `appengine-cloudsql-strapi` - Containerized app with Cloud SQL

**Full blueprint catalog with descriptions, use cases, and decision trees:** See [Blueprint Catalog](docs/blueprints/catalog.md) or [AGENTS.md](AGENTS.md) for AI assistant integration

## Blueprint Structure

Every blueprint follows a consistent, self-contained structure:

```text
{blueprint-name}/
├── environments/
│   └── dev/
│       ├── main.tf           # Module composition
│       ├── variables.tf      # Input variables
│       ├── outputs.tf        # Output values
│       ├── versions.tf       # Provider versions
│       ├── terraform.tfvars  # Configuration values
│       └── backend.tf.example  # Backend configuration template
├── modules/                  # Self-contained modules
│   ├── api/                  # API Gateway/Lambda/AppSync
│   ├── compute/              # Lambda functions or ECS services
│   ├── data/                 # Database (DynamoDB, RDS, Aurora, etc.)
│   ├── networking/           # VPC, subnets, security groups (if needed)
│   ├── naming/               # Naming conventions
│   └── tagging/              # Resource tagging
├── src/                      # Application code examples (if any)
├── tests/                    # Terraform tests (.tftest.hcl)
│   ├── blueprint.tftest.hcl  # Main test suite
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── scripts/                  # Helper scripts (environment creation, etc.)
└── README.md                 # Blueprint-specific documentation
```

**Key principles:**

- All modules are included within the blueprint (no external dependencies)
- Each blueprint can be copied and deployed independently
- Consistent structure makes it easy to navigate and understand
- Tests ensure blueprints work correctly before deployment

For more details, see [Blueprint Structure](docs/blueprints/catalog.md#blueprint-structure) in the catalog.

## Architecture Decision Records

We use [ADRs](docs/adr/README.md) to document significant architectural decisions:

| ADR | Title                                                              | Status   |
|-----|---------------------------------------------------------------------|----------|
| [0001](docs/adr/0001-standalone-blueprints.md) | Standalone Self-Contained Blueprints | Approved |
| [0002](docs/adr/0002-expand-scope-pattern-extraction.md) | Expand Scope to Support Pattern Extraction | Approved |
| [0003](docs/adr/0003-mcp-server-ai-discovery.md) | MCP Server for AI-Assisted Blueprint Discovery | Approved |
| [0004](docs/adr/0004-supported-consultant-scenarios.md) | Supported Consultant Scenarios | Approved |
| [0005](docs/adr/0005-secrets-management-pattern.md) | Secrets Management Pattern | Approved |
| [0006](docs/adr/0006-progressive-disclosure-agents.md) | Progressive Disclosure for AGENTS.md | Approved |

## Key Information

- **Secrets Management**: All blueprints use a two-flow pattern for secure secret handling. See [ADR-0005](docs/adr/0005-secrets-management-pattern.md) for details.
- **Terraform Version**: Most blueprints require Terraform >= 1.9. Blueprints using ephemeral values (RDS, Aurora, RDS Proxy, AppSync) require Terraform >= 1.11. See individual blueprint READMEs for specific requirements.
- **Official Modules**: Blueprints use [terraform-aws-modules](https://registry.terraform.io/namespaces/terraform-aws-modules) for battle-tested infrastructure components

## AI Assistant Integration

For ustwo developers: Configure the MCP server to give AI assistants automatic awareness of these blueprints. The MCP server enables AI assistants to:

- **Recommend blueprints** based on requirements (database type, API pattern, etc.)
- **Extract patterns** from blueprints for existing projects
- **Compare architectural options** (Lambda vs ECS, RDS vs Aurora, etc.)
- **Find cross-cloud equivalents** (AWS → Azure → GCP)
- **Fetch blueprint files** to view code examples and adapt them

**How MCP works:**

- **MCP server**: Helps you discover, understand, and extract patterns from blueprints
- **Download step**: MCP will guide you to download the blueprint files to your local machine
- **Workflow**: Use MCP to find what you need → Download it → Use MCP to get guidance on customization

**Example workflow:**

1. Ask AI: "I need a serverless API with PostgreSQL"
2. AI uses MCP to recommend `apigw-lambda-rds` and explains why
3. AI provides download instructions
4. After download, AI can help customize using MCP's `fetch_blueprint_file()` tool

See [mcp-server/README.md](mcp-server/README.md) for setup instructions.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and pre-commit hooks
- Code style and testing requirements
- Pull request process
- Documentation standards

**Key principles:**

- All blueprints must be self-contained (no external dependencies)
- Follow the established blueprint structure
- Include comprehensive tests and documentation
- Use conventional commits for all changes

**Automated Releases:**

- MCP server releases are fully automated using `semantic-release`
- Commits to `mcp-server/**` automatically trigger version bumps, changelog generation, npm publishing, and Docker builds
- Use conventional commits (`feat:`, `fix:`, `feat!:`) for automatic versioning

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

- **Maintainer**: Bernardo Trindade de Abreu
- **Email**: <bernardo.trindade-de-abreu@ustwo.com>
- **GitHub Issues**: [Open an issue](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues) for bug reports or feature requests
- **Pull Requests**: [Submit a PR](https://github.com/berTrindade/terraform-infrastructure-blueprints/pulls) for contributions
