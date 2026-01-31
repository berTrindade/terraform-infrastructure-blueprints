# Progressive Disclosure for AGENTS.md

Date: 2026-01-26
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
   - Rejected: Too expensive in token consumption

2. **Split by cloud provider**
   - Pros: Clear separation by provider
   - Cons: Doesn't address token consumption, creates artificial boundaries
   - Rejected: Doesn't solve the core problem

3. **Remove detailed content entirely**
   - Pros: Minimal token cost
   - Cons: Loses valuable context, reduces AI assistant effectiveness
   - Rejected: Too extreme, loses value

## Consequences

### Benefits

- **Token Efficiency**: AI assistants load only relevant documentation
- **Maintainability**: Easier to update specific sections
- **Clarity**: Clear separation of concerns
- **Scalability**: Can add new documentation files without bloating root file

### Trade-offs

- **Multiple Files**: Documentation spread across multiple files
- **Maintenance Discipline**: Must maintain progressive disclosure pattern
- **Initial Setup**: Requires refactoring existing content

### Impact

- **AI Assistant Performance**: Reduced token consumption, faster responses
- **Developer Experience**: Must navigate multiple files, but clearer organization
- **Maintenance**: Easier to update specific sections, but must follow pattern
- **Onboarding**: New contributors must understand progressive disclosure

## Notes

This decision is critical for AI assistant integration. The progressive disclosure pattern ensures that AI assistants can access comprehensive documentation without paying the token cost of loading everything on every request. The pattern is enforced in `CONTRIBUTING.md` and maintained through code review.
