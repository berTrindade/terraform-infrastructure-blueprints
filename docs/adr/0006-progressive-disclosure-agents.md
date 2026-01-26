# Progressive Disclosure for AGENTS.md

Date: 2026-01-24
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

The `AGENTS.md` file had grown to 375 lines, containing:
- Project description and purpose
- Detailed blueprint catalog (20+ blueprints)
- Cross-cloud equivalents table
- Decision trees
- Blueprint structure documentation
- Key patterns (secrets, naming, VPC)
- Three detailed workflows
- Common customizations table
- Quick reference commands
- Important constraints

This created an instruction budget problem: AI assistants load the entire `AGENTS.md` file on every request, consuming tokens for content that may not be relevant to the current task. Most interactions only need a subset of this information.

The challenge was balancing comprehensive documentation against token efficiency and maintainability.

## Decision

Refactor `AGENTS.md` using progressive disclosure:

1. **Minimal root `AGENTS.md`** (~10-15 lines) containing only:
   - One-sentence project description
   - Key principle
   - Consultancy model
   - References to detailed documentation files

2. **Domain-specific documentation files** in `docs/blueprints/`:
   - `catalog.md` - Blueprint catalog, decision trees, cross-cloud equivalents, blueprint structure
   - `workflows.md` - Usage scenarios and step-by-step workflows
   - `patterns.md` - Key patterns (secrets, naming, VPC, extractable patterns)
   - `customization.md` - Common customizations, commands, constraints

3. **Maintenance guidance** in `CONTRIBUTING.md` to prevent regression

This approach allows AI assistants to load only the documentation relevant to the current task, reducing token consumption while maintaining comprehensive documentation.

## Alternatives Considered

1. **Keep everything in root `AGENTS.md`**
   - Pros: Single file, easy to find
   - Cons: High token cost on every request, harder to maintain, violates instruction budget principles

2. **Split by cloud provider**
   - Pros: Clear separation by provider
   - Cons: Cross-cutting concerns (patterns, workflows) don't fit well, still large files

3. **Split by use case**
   - Pros: Task-oriented organization
   - Cons: Overlaps with workflows, harder to navigate

4. **Progressive disclosure by domain** (chosen)
   - Pros: Clear domain boundaries, efficient token usage, easier maintenance, supports growth
   - Cons: Requires navigation between files (mitigated by clear references)

## Consequences

**Benefits:**
- Reduced token consumption: Only essential context loaded per request
- Better maintainability: Domain-specific docs easier to update independently
- Future-proof: Structure supports growth without bloating root file
- Clear navigation: Agents can find relevant docs based on task
- Documented decision: ADR explains why, CONTRIBUTING.md explains how to maintain

**Risks:**
- Agents may need to load multiple files for complex tasks
- Risk of content regressing back into root `AGENTS.md` without maintenance guidance

**Mitigations:**
- Clear references in root `AGENTS.md` guide agents to relevant docs
- Maintenance guidance in `CONTRIBUTING.md` prevents regression
- ADR documents the decision for future team members
- Domain boundaries are clear and stable (catalog, workflows, patterns, customization)

## Notes

This follows the progressive disclosure pattern recommended for AI assistant documentation: minimize root file size while providing comprehensive documentation through referenced files. The structure prioritizes instruction budget efficiency while maintaining discoverability and maintainability.
