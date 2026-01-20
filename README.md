# Table of Contents

- [What is this?](#what-is-this)
- [What it is not](#what-it-is-not)
- [Repository layout](#repository-layout)
- [Key principles](#key-principles)
- [How to use](#how-to-use)
- [Ways to Use](#ways-to-use)
- [AI accessibility](#ai-accessibility)
- [CI/CD Pipeline](#cicd-pipeline)
- [Maintainer](#maintainer)

## Terraform Infrastructure Blueprints

Opinionated, repeatable Infrastructure-as-Code blueprints for bootstrapping cloud foundations across GCP, AWS, and Azure.
Each example is a fully self-contained IaC package that includes everything needed to deploy that pattern: modules, configurations, and conventions all in one place.

Consultants copy the example they need, adapt it, and hand over clean, client-owned infrastructure code.
No dependencies. No shared modules. No vendor lock-in.

## What is this?

A library of complete, standalone IaC examples, organized by cloud provider:

- GCP → multiple end-to-end examples (e.g., opinionated project setups, service deployments, network patterns)
- AWS → multiple complete examples (e.g., ECS services, Lambda stacks, account foundations)
- Azure → multiple complete examples (e.g., subscription scaffolding, app patterns, resource setups)

Every example folder contains:

- Its own Terraform modules
- Its own naming/tagging logic
- Its own IAM setup
- Its own logging patterns
- Its own main Terraform configuration
- Clear documentation for how to use it

Copy any example and you have a working blueprint.

## What it is not

- Not a reusable Terraform module source
- Not tied to any ustwo system, pipeline, or secret
- Not referencing other examples or shared folders
- Not intended as a turnkey production platform
- Not something clients must keep connected to ustwo after handover

Everything is local, isolated, and modifiable.

## Repository layout

```text
/gcp/
  example-ecs-node/
    main.tf
    modules/
      iam/
      logging/
      tagging/
      naming/
  example-networking/
    main.tf
    modules/
      iam/
      logging/
      ...
  example-custom/
    ...
/aws/
  example-ecs-python/
    main.tf
    modules/
  example-account-foundation/
    main.tf
    modules/
  example-custom/
    ...
/azure/
  example-subscription-scaffold/
    main.tf
    modules/
  example-app-pattern/
    main.tf
    modules/
  example-custom/
    ...
```

### Key principles

- Each example is a complete blueprint.
- Examples do not depend on each other.
- There is no shared folder.
- Each example includes its own modules and utilities.

Users copy one example folder and get everything they need.

## How to use

## Ways to Use

### 1. Direct Copy

- Browse the examples under `/gcp`, `/aws`, or `/azure` and choose the one that matches your needs.
- Copy the example folder into your project—this can be a dedicated infrastructure folder (like `infra/` or `infrastructure/`) inside your main application repo, or a separate infrastructure repo alongside your app code.
- For example:
  - Monorepo: `my-app/infra/` (application code in `src/`, infrastructure code in `infra/`)
  - Multi-repo: `my-app` (application repo), `my-app-infra` (infrastructure repo)
- Customize IAM, naming/tagging, networking, environment structure, and module internals as needed to fit your application's requirements.

### 2. Use tiged (Recommended)

Use [tiged](https://github.com/tiged/tiged) to download a specific blueprint (each child folder under `blueprints/` is a complete blueprint) without cloning the whole repo:

```bash
# Download an AWS ECS Node.js blueprint
npx tiged ustwo/terraform-infra-blueprints/blueprints/ecs-node my-ecs-node

# Download a GCP blueprint
npx tiged ustwo/terraform-infra-blueprints/gcp/example-1 my-gcp-example

# Download an Azure blueprint
npx tiged ustwo/terraform-infra-blueprints/azure/example-1 my-azure-example
```

### 3. Use AI Tools

You can use AI agents (GitHub Copilot, Cursor, ChatGPT, Claude, etc.) to help you set up a complete infrastructure folder for your client project using these examples:

#### Example Workflow

1. **Share the example folder with your AI tool**

- Paste the folder structure or link to the example in your AI chat.

2. **Describe your requirements**

- E.g., "Adapt this ECS Node.js example for a client with two environments (dev, prod), custom tags, and private networking."

3. **Request code generation and refactoring**

- Ask the AI to update variables, add modules, or restructure files as needed.

4. **Generate documentation and CI/CD workflows**

- Request README updates, pipeline configs, or cost/security reviews.

5. **Copy the AI-generated code into your client repo**

This approach works with:

- GitHub Copilot (inline code completion)
- Cursor (AI pair programming)
- ChatGPT/Claude (chat-based code generation)
- Amazon Q (AWS-specific guidance)

AI tools can:

- Scaffold full client environments
- Refactor and adapt modules
- Duplicate patterns across clouds
- Generate custom variants
- Review for security, cost, and best practices

### 4. Deliver Clean, Client-Owned IaC

Before handover, ensure:

- No references to ustwo repos
- No external dependencies outside OSS
- All modules and code are contained in the client repo
- Documentation matches the client’s environment

## AI accessibility

This structure is AI-optimized:

- Each example is a complete “unit” an AI can analyze without external context
- Modules sit inside the example, so AI never has to resolve imports across folders
- Clear, predictable structure across clouds
- Easy for AI to copy an example and generate a new client repo
- No shared modules → no dependency ambiguity
- Works perfectly with tools like Cursor, ChatGPT agents, MCP, and IDE assistants

AI can reliably:

- scaffold full client environments
- refactor modules
- adapt naming/tagging
- duplicate patterns across clouds
- generate custom variants

All without risking vendor lock-in.

## CI/CD Pipeline

For best practices, you can combine all checks (validation, linting, security scan) into a single workflow, and keep the release workflow separate:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    paths:
      - "**/*.tf"
      - "**/main.tf"
      - "**/modules/**"
      - "**/*.md"
jobs:
  validate:
    # Terraform Validate job
  lint:
    # Markdown Lint job
  security:
    # Terraform Security Scan job
```

And a separate workflow for releases:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - "v*"
jobs:
  release:
    # Release job
```

When an example in this repository is updated, changes do not automatically apply to copies in client projects. To keep your infrastructure up to date:

1. **Watch for updates:** Monitor this repository for new releases, improvements, or security fixes.
2. **Compare changes:** When an update is published, compare your local example folder with the updated version in this repo.
3. **Merge manually:** Manually merge relevant changes into your local copy, taking care to preserve any customizations.
4. **Test before applying:** Always test updates in a non-production environment before rolling out to production.
5. **Document customizations:** Keep notes on any changes you make to the example so you can reapply them after future updates.

This manual update flow ensures you stay secure and benefit from improvements, while maintaining full control over your infrastructure code.

- Self-contained examples
  Each example includes everything it needs: its own modules, logic, patterns, and configs.
- Client-first ownership
  Delivered IaC should be entirely controlled by the client.
- Zero vendor lock-in
  No ustwo references, remote sources, or implicit dependencies.
- Opinionated but flexible
  Patterns enforce strong defaults but allow easy modification.
- AI-friendly structure
  Example-driven, isolated, predictable folder layouts ideal for automated code generation.

## Maintainer

Bernardo Trindade de Abreu (<bernardo.trindade-de-abreu@ustwo.com>)
