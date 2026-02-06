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
| `style-guide` | Selecting blueprints, naming/tagging, writing/reviewing Terraform, architectural decisions; decision tree, catalog, and priority rules (CRITICAL/HIGH/MEDIUM/LOW). |
| `code-generation` | Adding a capability to an existing project; generate Terraform from parameterized templates. |
| `mcp-discovery` | Finding blueprints, fetching files, workflow guidance; when to use each MCP tool. |
| `security` | Secrets (RDS/Aurora passwords, Secrets Manager, IAM DB auth; never in state) and security groups (Lambda, RDS, API Gateway, ECS; least-privilege, no 0.0.0.0/0). |
| `terraform-practices` | Testing (native/Terratest, decision matrix), CI/CD (validate→test→plan→apply), code structure (block ordering, count/for_each); use with blueprint-generated or blueprint-style Terraform. |
