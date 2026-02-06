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

- Terraform >= 1.11 recommended; blueprints using RDS/Aurora/ephemeral (write-only) require 1.11+. The code-generation skill produces code compatible with Terraform 1.11+.
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

See [Project examples](examples/README.md) for scenario-based walkthroughs (app exists, hybrid, add capability).

For detailed guides, see:

- [Developer Workflow](docs/developer-workflow.md) - How developers work with blueprints
- [AI Assistant Guidelines](docs/ai-assistant-guidelines.md) - Guidelines for AI assistants
- [Template Generator Development](skills/code-generation/DEVELOPMENT.md) - Development guide for the template generator

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

**Full blueprint catalog with descriptions, use cases, and decision trees:** See [Blueprint Catalog](docs/blueprints/catalog.md)

**Documentation:**

- [Developer Workflow](docs/developer-workflow.md) - How developers work with blueprints
- [AI Assistant Guidelines](docs/ai-assistant-guidelines.md) - Guidelines for AI assistants
- [MCP Tools Reference](docs/mcp-tools-reference.md) - Technical reference for MCP tools
- [Manifests and Templates](docs/manifests-and-templates.md) - How the system works

See [AGENTS.md](AGENTS.md) for AI assistant integration setup.

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

| ADR | Title | Status |
|-----|-------|--------|
| [0001](docs/adr/0001-standalone-blueprints.md) | Standalone Self-Contained Blueprints | Approved |
| [0002](docs/adr/0002-expand-scope-pattern-extraction.md) | Expand Scope to Support Pattern Extraction | Approved |
| [0003](docs/adr/0003-secrets-management-pattern.md) | Secrets Management Pattern | Approved |
| [0004](docs/adr/0004-progressive-disclosure-agents.md) | Progressive Disclosure for AGENTS.md | Approved |
| [0005](docs/adr/0005-skills-vs-mcp-decision.md) | Skills vs MCP: When to Use Each Approach | Approved |
| [0006](docs/adr/0006-documentation-consolidation.md) | Documentation Consolidation and Cleanup | Approved |
| [0007](docs/adr/0007-manifest-based-template-generation.md) | Manifest-Based Template Generation Architecture | Approved |

## Key Information

- **Secrets Management**: All blueprints use a two-flow pattern for secure secret handling. See [Patterns Guide](docs/blueprints/patterns.md) for details.
- **Terraform Version**: Terraform >= 1.11 is recommended. Blueprints using ephemeral values (RDS, Aurora, RDS Proxy, AppSync) require Terraform 1.11+. All blueprints in this repo use `required_version = ">= 1.11"`.
- **Official Modules**: Blueprints use [terraform-aws-modules](https://registry.terraform.io/namespaces/terraform-aws-modules) for battle-tested infrastructure components

## AI Assistant Integration

For ustwo developers: Configure the MCP server to give AI assistants automatic awareness of these blueprints. The MCP server enables AI assistants to:

- **Recommend blueprints** based on requirements (database type, API pattern, etc.)
- **Extract patterns** from blueprints for existing projects
- **Compare architectural options** (Lambda vs ECS, RDS vs Aurora, etc.)
- **Find cross-cloud equivalents** (AWS → Azure → GCP)
- **Fetch blueprint files** to view code examples and adapt them

**Documentation for AI Assistants:**

- **[AI Assistant Guidelines](docs/ai-assistant-guidelines.md)** - How AI assistants should reference blueprints
- **[MCP Tools Reference](docs/mcp-tools-reference.md)** - Technical reference for all MCP tools
- **[Developer Workflow](docs/developer-workflow.md)** - How developers interact with the system

**How MCP works:**

- **MCP server**: Helps you discover, understand, and extract patterns from blueprints
- **Download step**: MCP will guide you to download the blueprint files to your local machine
- **Workflow**: Use MCP to find what you need → Download it → Use MCP to get guidance on customization

**Example workflow:**

1. Ask AI: "I need a serverless API with PostgreSQL"
2. AI uses MCP to recommend `apigw-lambda-rds` and explains why
3. AI provides download instructions
4. After download, AI can help customize using MCP's `fetch_blueprint_file()` tool

**How we share Blueprint Knowledge with AI Assistants:**

We use two complementary approaches depending on what type of information needs to be shared:

- **MCP (Model Context Protocol)**: Think of this as a "live connection" that lets AI assistants search, discover, and get recommendations about blueprints in real-time. Best for when you need interactive help finding the right blueprint or extracting patterns. Like asking a librarian who can search the catalog for you.

- **Skills**: Think of these as "local reference guides" installed directly in your AI assistant. They contain static knowledge about blueprint patterns, best practices, and documentation that doesn't change often. Best for quick lookups without needing to connect to external services. Like having a reference book on your desk.

**Why both?** MCP is great for discovery ("What blueprint should I use?"), but having too many live connections can slow down your IDE. Skills provide instant access to common patterns without network calls. We use MCP to find what you need, and Skills to quickly reference how to use it.

**New workflow (per ADR 0005)**: Static content (catalog, patterns) is now in Skills for instant access. MCP focuses on dynamic discovery tools. See [Workflows Guide](docs/blueprints/workflows.md) for detailed workflow examples.

**Installing Skills:**

For client projects, install blueprint skills using the standard `npx skills` tool:

```bash
npx skills add bertrindade/terraform-infrastructure-blueprints
```

This installs the `style-guide` skill which provides instant access to blueprint patterns, best practices, and documentation without network calls.

See [ADR 0005](docs/adr/0005-skills-vs-mcp-decision.md) for the full technical decision rationale.

See [packages/mcp/README.md](packages/mcp/README.md) for setup instructions.

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

- **MCP server** (`packages/mcp/`): Fully automated using `semantic-release`
  - Commits to `packages/mcp/**` automatically trigger version bumps, changelog generation, npm publishing (GitHub Packages), and Docker builds (GHCR)
- Use conventional commits (`feat:`, `fix:`, `feat!:`) for automatic versioning

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

- **Maintainer**: Bernardo Trindade de Abreu
- **Email**: <bernardo.trindade-de-abreu@ustwo.com>
- **GitHub Issues**: [Open an issue](https://github.com/berTrindade/terraform-infrastructure-blueprints/issues) for bug reports or feature requests
- **Pull Requests**: [Submit a PR](https://github.com/berTrindade/terraform-infrastructure-blueprints/pulls) for contributions
