# Terraform Infrastructure Blueprints - AI Assistant Guide

Opinionated, standalone Infrastructure-as-Code blueprints for AWS, Azure, and GCP. Each blueprint is a complete, self-contained package you can copy and own - no dependencies, no vendor lock-in.

**Key principle**: Copy one blueprint folder and you have everything needed.

**Consultancy model**: ustwo builds for clients. When engagements end, clients own the code. Generated Terraform must be completely standalone with zero ustwo dependencies.

For detailed documentation, see:

- [Blueprint Catalog](docs/blueprints/catalog.md) - Complete blueprint reference, decision trees, cross-cloud equivalents
- [Workflows](docs/blueprints/workflows.md) - Usage scenarios and step-by-step workflows
- [Patterns](docs/blueprints/patterns.md) - Key patterns (secrets, naming, VPC, extractable patterns)
- [Customization](docs/blueprints/customization.md) - Common customizations, commands, constraints

**For AI Assistants**:

- [Developer Workflow](docs/developer-workflow.md) - How developers work with blueprints
- [AI Assistant Guidelines](docs/ai-assistant-guidelines.md) - Guidelines for AI assistants
- [MCP Tools Reference](docs/mcp-tools-reference.md) - Technical reference for MCP tools
- [Manifests and Templates](docs/manifests-and-templates.md) - How the system works
- [Patterns with Examples](docs/blueprints/patterns.md) - Key patterns including wrong vs right code comparisons

**Skills** (when to use which):

| Skill | Use when |
|-------|----------|
| `infrastructure-style-guide` | Selecting blueprints, writing/reviewing Terraform, architectural decisions; full catalog and priority rules (CRITICAL/HIGH/MEDIUM/LOW). |
| `infrastructure-code-generation` | Adding a capability to an existing project; generate Terraform from parameterized templates. |
| `infrastructure-selection` | Choosing the right blueprint; decision tree, sync vs async, database type, cross-cloud. |
| `mcp-discovery` | Finding blueprints, fetching files, workflow guidance; when to use each MCP tool. |
| `secrets-and-ephemeral-passwords` | RDS/Aurora passwords, Secrets Manager, IAM DB auth; never store secrets in state. |
| `security-groups-least-privilege` | Security group rules for Lambda, RDS, API Gateway, ECS; least-privilege, no 0.0.0.0/0. |
| `infrastructure-naming-conventions` | Naming resources, tagging; project-environment-component pattern. |
