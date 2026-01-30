# MCP Server for AI-Assisted Blueprint Discovery

Date: 2026-01-23
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

Developers at ustwo use various AI-assisted coding tools including Cursor, GitHub Copilot, Claude Desktop, and ChatGPT. We wanted AI assistants to automatically understand our blueprint catalog and guide developers through infrastructure decisions without requiring manual copy/paste of documentation.

Key requirements:

- Tool-agnostic: Should work across different AI assistants
- Seamless: Developers shouldn't need to manually provide context
- Private repo compatible: Must securely access the private GitHub repository
- Internal only: This tooling is for ustwo developers, not delivered to clients

The challenge was finding an approach that works across AI tools while respecting the private nature of the repository.

## Decision

Build an MCP (Model Context Protocol) server distributed via GitHub Packages as `@ustwo/infra-mcp`. The server:

- Runs locally on each developer's machine via `npx`
- Uses `stdio` transport (no network hosting required)
- Fetches context from AGENTS.md via `gh` CLI (leverages existing GitHub auth)
- Exposes tools for searching blueprints, getting details, and receiving recommendations

Developers configure it once in their AI tool (Cursor, Claude Desktop) and then can simply ask questions like "I need a serverless API with PostgreSQL" without providing additional context.

## Alternatives Considered

1. **AGENTS.md only**
   - Description: Static markdown file in repo root that AI tools can read
   - Pros: Simple, no infrastructure, works in Cursor automatically
   - Cons: Requires manual copy/paste for non-Cursor tools, no interactivity

2. **Custom Cursor skill only**
   - Description: Build a Cursor-specific integration using Skills API
   - Pros: Deep integration with Cursor, automatic context
   - Cons: Only works in Cursor, vendor lock-in to one tool, no interactive discovery

3. **Public documentation site**
   - Description: Host blueprint docs on a public website AI can access
   - Pros: Universal access, no authentication needed
   - Cons: Exposes internal patterns publicly, no interactivity, SEO concerns

4. **VS Code extension**
   - Description: Build extension that provides context to Copilot
   - Pros: Works with GitHub Copilot
   - Cons: Only works in VS Code, significant development effort

**Note**: We later adopted a hybrid approach (see [ADR 0009](./0009-skills-vs-mcp-decision.md)) using both Skills for static content and MCP for interactive discovery.

## Consequences

**Benefits:**

- Tool-agnostic: Works with any AI tool that supports MCP
- Automatic context: AI understands blueprints without manual input
- Interactive: Can search, filter, and get recommendations
- Secure: Uses existing GitHub authentication via `gh` CLI
- No hosting: Runs locally, no infrastructure to maintain

**Risks:**

- Requires npm/node installed on developer machines
- Developers must configure MCP once per AI tool
- MCP is a relatively new protocol, ecosystem still maturing

**Impact:**

- Create `mcp-server/` directory with TypeScript implementation
- Publish to GitHub Packages as `@ustwo/infra-mcp`
- Document setup in README for Cursor and Claude Desktop
- This is internal tooling only; never delivered to clients

## Notes

MCP (Model Context Protocol) is an open standard by Anthropic for AI agents to discover and interact with external tools and resources. It's supported by Cursor, Claude Desktop, and increasingly other AI tools.

The MCP server is purely for ustwo developer productivity. It has no impact on client deliverables, which remain standalone Terraform code with no ustwo dependencies.

**Update (2026-01-30)**: We've adopted a hybrid approach using both MCP and Skills. See [ADR 0009](./0009-skills-vs-mcp-decision.md) for details. The MCP server focuses on interactive discovery and recommendation workflows, while Skills handle static blueprint patterns and development workflows.
