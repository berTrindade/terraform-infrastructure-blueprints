# Migrate from Custom CLI to Standard skills.sh Distribution

Date: 2026-01-31
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

Initially, we created a custom CLI package (`@bertrindade/agent-skills`) to distribute skills to client projects. This custom tool allowed users to install blueprint skills using a dedicated command, providing a convenient way to add blueprint knowledge to AI assistants.

However, the skills.sh ecosystem emerged as an industry standard for skill distribution across AI development tools. The custom CLI package required ongoing maintenance including:

- Package publishing and version management
- Compatibility updates for different AI tools
- Custom installation logic and documentation
- Maintenance burden separate from the actual skill content

Meanwhile, the skills.sh standard provides:
- Universal compatibility with all major AI tools (Cursor, Claude Desktop, GitHub Copilot, etc.)
- Standard installation via `npx skills` (no custom tooling needed)
- Industry-wide adoption and community support
- Reduced maintenance overhead

**The Challenge:** We needed to decide whether to continue maintaining a custom CLI package or migrate to the standard skills.sh distribution mechanism. This decision impacts maintenance burden, user experience, and alignment with industry standards.

## Decision

Migrate from the custom CLI package to the standard skills.sh distribution:

- **Remove** the `packages/cli/` package entirely
- **Distribute** skills via skills.sh standard using `npx skills add bertrindade/terraform-infrastructure-blueprints`
- **Update** all documentation to reference the standard installation method
- **Simplify** the architecture by removing custom tooling

Users now install skills using the standard `npx skills` command, which works with all agents that support the skills.sh standard. This eliminates the need for custom CLI tooling and aligns with industry best practices.

## Alternatives Considered

1. **Keep Custom CLI**
   - **Description:** Continue maintaining the `@bertrindade/agent-skills` CLI package
   - **Pros:** Full control over installation experience, custom features possible
   - **Cons:** Ongoing maintenance burden, compatibility updates required, non-standard approach, users need to learn custom tooling
   - **Decision:** Rejected - maintenance burden outweighs benefits

2. **Migrate to skills.sh (Chosen)**
   - **Description:** Use standard skills.sh distribution via `npx skills`
   - **Pros:** Industry standard, universal compatibility, no custom tooling to maintain, simpler for users, community support
   - **Cons:** Migration effort required, users need to update workflows
   - **Decision:** Chosen - aligns with industry standards and reduces maintenance

3. **Hybrid Approach**
   - **Description:** Support both custom CLI and skills.sh distribution
   - **Pros:** Backward compatibility, gradual migration possible
   - **Cons:** Increased complexity, maintaining two distribution methods, confusing for users
   - **Decision:** Rejected - adds unnecessary complexity

## Consequences

**Benefits:**

- **Reduced Maintenance:** No custom CLI package to maintain, update, or publish
- **Better Compatibility:** Standard tools work with all major AI development environments
- **Industry Alignment:** Follows established patterns used across the AI development community
- **Simpler User Experience:** Users use familiar `npx skills` command instead of custom tooling
- **Simplified Architecture:** Removed entire CLI package, reducing codebase complexity

**Risks:**

- **Migration Effort:** Required updating documentation and user workflows
- **User Impact:** Existing users needed to update their installation methods
- **Transition Period:** Brief period where users might be confused about which method to use

**Impact:**

- **Removed:** `packages/cli/` package entirely
- **Updated:** All documentation to reference `npx skills add bertrindade/terraform-infrastructure-blueprints`
- **Simplified:** Architecture by removing custom tooling layer
- **Aligned:** Distribution method with industry standards (skills.sh)
- **Maintained:** Skill content remains the same, only distribution mechanism changed

## Implementation Details

The migration involved:

1. **Removal of CLI Package:** Deleted `packages/cli/` directory and related npm package
2. **Documentation Updates:** Updated all references from custom CLI to standard `npx skills` command
3. **Skills.sh Integration:** Skills are now distributed via skills.sh standard repository structure
4. **User Communication:** Updated installation instructions across all documentation

The skill content itself (`skills/blueprint-best-practices/`) remained unchanged - only the distribution mechanism was updated.

## Relationship to Other ADRs

This ADR complements [ADR 0005: Skills vs MCP Decision](./0005-skills-vs-mcp-decision.md):

- **ADR 0005** covers **when** to use skills vs MCP (the decision about what to distribute)
- **ADR 0009** covers **how** to distribute skills (the mechanism for distribution)

Both decisions work together: we use skills for static blueprint patterns (ADR 0005), and we distribute them via the standard skills.sh mechanism (this ADR).

## Notes

### Migration Status

This migration is **complete**. The custom CLI package has been removed, and all documentation has been updated to reference the standard skills.sh distribution method.

### Future Considerations

- **No Custom Tooling:** We no longer maintain any custom CLI packages for skill distribution
- **Standard Tools Only:** All skill distribution uses industry-standard tools (`npx skills`)
- **Focus on Content:** More time can be spent on improving skill content rather than maintaining distribution tooling

### User Impact

Users who previously used `@bertrindade/agent-skills` should migrate to:
```bash
npx skills add bertrindade/terraform-infrastructure-blueprints
```

This command works with all major AI development tools and requires no custom tooling.

## References

- [ADR 0005: Skills vs MCP Decision](./0005-skills-vs-mcp-decision.md) - When to use skills vs MCP
- [skills.sh Documentation](https://skills.sh/) - Standard skill distribution platform
- Current skill distribution: `npx skills add bertrindade/terraform-infrastructure-blueprints`
