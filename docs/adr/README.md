# Architectural Decision Records (ADRs)

At their core, **Architectural Decision Records (ADRs)** are about clarity, collaboration, and capturing the "why" behind the big choices we make. They're our way of documenting the thinking and context behind the technical decisions that shape a project.

---

## Table of Contents

1. [Why We Use ADRs](#why-we-use-adrs)
2. [When to Create an ADR](#when-to-create-an-adr)
3. [How to Structure an ADR](#how-to-structure-an-adr)
4. [Where to Keep an ADR](#where-to-keep-an-adr)
5. [Decision Log](#decision-log)

---

## Why We Use ADRs

ADRs bring structure to the decision-making process. They help us:

1. **Stay Transparent:** Everyone knows the thinking behind a decision.
2. **Learn from the Past:** They're a time capsule for the reasoning and trade-offs made.
3. **Keep Consistency:** A shared approach to documenting our work.
4. **Collaborate:** Invite discussion and build confidence in the choices we make.
5. **Share Knowledge:** A great way to onboard new team members or pass the torch on a project.

---

## When to Create an ADR

We use ADRs for the big decisions—the ones that will impact the project long-term or be tricky to change later. Think about:

- Picking frameworks, libraries, or tech stacks.
- Defining APIs or how systems will integrate.
- Choosing a deployment strategy or cloud provider.
- Agreeing on coding standards and best practices.
- Tackling technical debt or migrating to a new system.

---

## How to Structure an ADR

Every ADR tells a story: what happened, why it mattered, and what we decided to do. Here's a simple format to follow:

```markdown
# [Title of the ADR]
Date: YYYY-MM-DD
Owner: [Owner name]
Contributors: [Contributor names]
Status: Draft | In Review | Approved | Superseded

## Context
Explain the background, problem, or situation leading to the decision. Include relevant constraints, requirements, and stakeholders.

## Decision
Clearly state the decision made. Be concise and direct.

## Alternatives Considered
List other options considered, along with their pros and cons.

1. **Alternative A:** Description, Pros, Cons
2. **Alternative B:** Description, Pros, Cons

## Consequences
Explain the trade-offs and implications of the decision, including:
- Benefits
- Risks
- Potential impacts (on the team, codebase, or future work)

## Notes
(Optional) Additional context or follow-up actions.
```

---

## Where to Keep an ADR

Here are a few key considerations when deciding upon where to store ADRs. Prioritise accessibility, versioning, and alignment with development processes.

In most cases storing in the same repository as the code allows for easy access and versioning (e.g., `/docs/adr/`). Wider teams may look to use tools like Google Drive, Confluence or Notion for a single source of truth across teams where repo access may be an issue.

---

## Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-standalone-blueprints.md) | Standalone Self-Contained Blueprints | Approved | 2026-01-23 |
| [0002](0002-expand-scope-pattern-extraction.md) | Expand Scope to Support Pattern Extraction | Approved | 2026-01-23 |
| [0003](0003-mcp-server-ai-discovery.md) | MCP Server for AI-Assisted Blueprint Discovery | Approved | 2026-01-23 |
| [0004](0004-supported-consultant-scenarios.md) | Supported Consultant Scenarios | Approved | 2026-01-23 |
| [0005](0005-secrets-management-pattern.md) | Secrets Management Pattern | Approved | 2026-01-24 |